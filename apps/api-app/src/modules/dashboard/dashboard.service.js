const { prisma } =
    require("@inventory/database");

const redis =
    require("../../lib/redis");

const getStockStatus = (stock, minimumStock) => {

    if (Number(stock) === 0)
        return "OUT_OF_STOCK";

    if (Number(stock) <= Number(minimumStock || 0))
        return "LOW_STOCK";

    return "NORMAL";
};


exports.summary = async (
    tenantId
) => {

    const cacheKey =
        `dashboard:${tenantId}`;

    const cache =
        await redis.get(cacheKey);

    if (cache) {

        console.log(
            "Dashboard from Redis"
        );

        return JSON.parse(cache);

    }

    console.log(
        "Dashboard from DB"
    );

    const thirtyDaysAgo = new Date();

    thirtyDaysAgo.setDate(
        thirtyDaysAgo.getDate() - 30
    );

    const AT_RISK_DAYS = 3;

    const [
        totalProducts,
        totalSuppliers,
        totalSales,
        totalCategories,
        totalStockItems,
        expenses,
        salesForProfit,
        productsForStock,
        productsForDeadStock,
        salesLast30DaysForTurnover,
        topCustomersRaw,
        customerClvRaw,
        customerRetentionRaw,
        customerSegmentsRaw,
        customerRiskRaw,
    ] = await Promise.all([

        prisma.product.count({
            where: { tenantId },
        }),

        prisma.supplier.count({
            where: { tenantId },
        }),

        prisma.sale.aggregate({
            where: { tenantId },
            _sum: {
                totalAmount: true,
            },
        }),

        prisma.category.count({
            where: { tenantId },
        }),

        prisma.product.aggregate({
            where: { tenantId },
            _sum: {
                stock: true,
            },
        }),

        prisma.expense.aggregate({
            where: { tenantId },
            _sum: {
                amount: true,
            },
        }),

        prisma.sale.findMany({
            where: {
                tenantId,
                status: "PAID",
            },
            include: {
                items: true,
            },
        }),

        // ambil semua product untuk hitung low stock berdasarkan minimumStock
        prisma.product.findMany({
            where: { tenantId },
            select: {
                id: true,
                name: true,
                stock: true,
                minimumStock: true,
                costPrice: true,
            },
        }),

        await prisma.product.findMany({

            where: {
                tenantId,
                stock: {
                    gt: 0,
                },
            },

            include: {

                saleItems: {

                    include: {
                        sale: {
                            select: {
                                createdAt: true,
                            },
                        },
                    },

                    take: 1,

                    orderBy: {
                        sale: {
                            createdAt: "desc",
                        },
                    },

                },

            },

        }),

        await prisma.sale.findMany({

            where: {
                tenantId,
                status: "PAID",
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },

            include: {
                items: true,
            },

        }),

        prisma.sale.groupBy({
            by: ["customerId"],
            where: {
                tenantId,
                customerId: {
                    not: null,
                },
            },
            _sum: {
                totalAmount: true,
            },
            _count: {
                id: true,
            },
            orderBy: {
                _sum: {
                    totalAmount: "desc",
                },
            },
            take: 5,
        }),

        prisma.sale.groupBy({
            by: ["customerId"],
            where: {
                tenantId,
                customerId: {
                    not: null,
                },
                status: "PAID",
            },
            _sum: {
                totalAmount: true,
            },
            _count: {
                id: true,
            },
            orderBy: {
                _sum: {
                    totalAmount: "desc",
                },
            },
            take: 10,
        }),

        prisma.sale.groupBy({
            by: ["customerId"],

            where: {
                tenantId,
                customerId: {
                    not: null,
                },
                status: "PAID",
            },

            _count: {
                id: true,
            },
        }),

        prisma.sale.groupBy({
            by: ["customerId"],

            where: {
                tenantId,
                customerId: {
                    not: null,
                },
                status: "PAID",
            },

            _sum: {
                totalAmount: true,
            },

            _count: {
                id: true,
            },
        }),

        prisma.sale.groupBy({

            by: ["customerId"],

            where: {
                tenantId,
                customerId: {
                    not: null,
                },
                status: "PAID",
            },

            _max: {
                createdAt: true,
            },

        }),

    ]);


    /* ========================= */
    /* LOW STOCK (MINIMUM STOCK) */
    /* ========================= */

    const lowStockProducts = productsForStock
        .map((p) => ({
            ...p,
            status: getStockStatus(p.stock, p.minimumStock),
        }))
        .filter((p) => p.status !== "NORMAL");

    const productScores = productsForStock.map((p) => {

        const status =
            Number(p.stock) === 0
                ? "OUT_OF_STOCK"
                : Number(p.stock) <= Number(p.minimumStock || 0)
                    ? "LOW_STOCK"
                    : "NORMAL";

        const score =
            status === "NORMAL"
                ? 2
                : status === "LOW_STOCK"
                    ? 1
                    : 0;

        return {
            ...p,
            status,
            score,
        };
    });

    const outOfStockCount = productsForStock.filter(
        (p) => Number(p.stock) === 0
    ).length;

    const criticalStockCount = productsForStock.filter(
        (p) =>
            Number(p.stock) > 0 &&
            Number(p.stock) <= Number(p.minimumStock || 0)
    ).length;

    const lowStockCount = lowStockProducts.length;

    const totalScore = productScores.reduce(
        (sum, p) => sum + p.score,
        0
    );

    const maxScore = productsForStock.length * 2;

    const inventoryHealthScore = maxScore
        ? Math.round((totalScore / maxScore) * 100)
        : 0;

    /* ========================= */
    /* STOCK VALUE */
    /* ========================= */

    const totalStockValue =
        productsForStock.reduce(
            (sum, item) =>
                sum +
                Number(item.costPrice || 0) *
                Number(item.stock || 0),
            0
        );


    /* ========================= */
    /* EXPENSE */
    /* ========================= */

    const totalExpense =
        Number(
            expenses._sum.amount || 0
        );

    /* ========================= */
    /* GROSS PROFIT */
    /* ========================= */

    let grossProfit = 0;

    for (const sale of salesForProfit) {

        for (const item of sale.items) {

            grossProfit +=

                (
                    Number(item.sellingPrice || 0) -
                    Number(item.costPrice || 0)
                ) *

                Number(item.quantity || 0);

        }

    }

    const netProfit =
        grossProfit - totalExpense;


    /* ========================= */
    /* INVENTORY TURNOVER */
    /* ========================= */

    let cogs30Days = 0;

    for (const sale of salesLast30DaysForTurnover) {

        for (const item of sale.items) {

            cogs30Days +=
                Number(item.costPrice || 0) *
                Number(item.quantity || 0);

        }

    }

    const inventoryTurnoverRatio =
        totalStockValue > 0

            ? Number(
                (
                    cogs30Days /
                    totalStockValue
                ).toFixed(2)
            )

            : 0;

    let inventoryTurnoverStatus =
        "Slow Moving";

    if (inventoryTurnoverRatio >= 4) {

        inventoryTurnoverStatus =
            "Fast Moving";

    } else if (
        inventoryTurnoverRatio >= 2
    ) {

        inventoryTurnoverStatus =
            "Healthy";

    }

    const productMap = {};

    for (const p of productsForStock) {
        productMap[p.id] = p.name;
    }

    // hitung profit per product
    const profitPerProductMap = {};
    // loop sales item
    for (const sale of salesForProfit) {

        for (const item of sale.items) {

            const productId = item.productId;

            if (!profitPerProductMap[productId]) {
                profitPerProductMap[productId] = {
                    productId,
                    name: productMap[productId] || "Unknown",
                    revenue: 0,
                    cost: 0,
                    quantity: 0,
                };
            }

            const cost =
                Number(item.costPrice || 0) *
                Number(item.quantity || 0);

            const revenue = Number(item.subtotal || 0);

            profitPerProductMap[productId].revenue += revenue;
            profitPerProductMap[productId].cost += cost;
            profitPerProductMap[productId].quantity += Number(item.quantity || 0);
        }
    }
    // hitung profit final
    const profitPerProduct = Object.values(profitPerProductMap).map((p) => ({
        ...p,
        profit: p.revenue - p.cost,
    }));
    // ambil TOP PROFIT + TOP LOSS
    const topProfitProducts = [...profitPerProduct]
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5)
        .map((p) => ({
            productId: p.productId,
            name: p.name,
            sold: p.quantity,
            margin: p.profit,
        }));

    const topLossProducts = [...profitPerProduct]
        .sort((a, b) => a.profit - b.profit)
        .slice(0, 5)
        .map((p) => ({
            productId: p.productId,
            name: p.name,
            sold: p.quantity,
            margin: p.profit,
        }));

    // STOCK MOVEMENT
    const stockIn = await prisma.stockMovement.aggregate({
        where: {
            tenantId,
            type: "IN",
        },
        _sum: {
            quantity: true,
        },
    });

    const stockOut = await prisma.stockMovement.aggregate({
        where: {
            tenantId,
            type: "OUT",
        },
        _sum: {
            quantity: true,
        },
    });

    const stockAdded =
        Number(stockIn._sum.quantity || 0);

    const stockRemoved =
        Number(stockOut._sum.quantity || 0);

    const stockTrend =
        stockAdded - stockRemoved;


    // DEAD STOCK
    const deadStockProducts =
        productsForDeadStock
            .map((product) => {

                const lastSale =
                    product.saleItems?.[0]
                        ?.sale?.createdAt;

                const daysWithoutSale =
                    lastSale
                        ? Math.floor(
                            (
                                Date.now() -
                                new Date(lastSale)
                            ) / 86400000
                        )
                        : 999;

                return {
                    id: product.id,
                    name: product.name,
                    stock: product.stock,
                    costPrice: product.costPrice,

                    inventoryValue:
                        Number(product.stock) *
                        Number(product.costPrice || 0),

                    daysWithoutSale,
                };

            })

            .filter(
                (p) => p.daysWithoutSale >= 30
            )

            .sort(
                (a, b) =>
                    b.daysWithoutSale -
                    a.daysWithoutSale
            )

            .slice(0, 5);


    const salesLast30Days =
        await prisma.saleItem.findMany({

            where: {

                sale: {
                    tenantId,

                    createdAt: {
                        gte: thirtyDaysAgo,
                    },
                },

            },

            select: {

                productId: true,
                quantity: true,

            },

        });


    const stockForecast =
        productsForStock
            .map((product) => {

                const soldQty =
                    salesLast30Days

                        .filter(
                            (s) =>
                                s.productId === product.id
                        )

                        .reduce(
                            (sum, s) =>
                                sum +
                                Number(
                                    s.quantity || 0
                                ),
                            0
                        );

                const avgPerDay =
                    soldQty / 30;

                const estimatedDaysLeft =
                    avgPerDay > 0

                        ? Math.floor(
                            product.stock /
                            avgPerDay
                        )

                        : null;

                return {

                    id: product.id,

                    name: product.name,

                    stock: product.stock,

                    avgPerDay:
                        avgPerDay.toFixed(1),

                    estimatedDaysLeft,

                };

            })

            .filter(
                (p) =>
                    p.estimatedDaysLeft !== null
            )

            .sort(
                (a, b) =>
                    a.estimatedDaysLeft -
                    b.estimatedDaysLeft
            )

            .slice(0, 5);

    // STOCK FORECAST END

    // STOCK COVERAGE
    const stockCoverage = productsForStock
        .map((product) => {

            const soldQty =
                salesLast30Days
                    .filter(
                        (s) =>
                            s.productId === product.id
                    )
                    .reduce(
                        (sum, s) =>
                            sum +
                            Number(
                                s.quantity || 0
                            ),
                        0
                    );

            const avgPerDay =
                soldQty / 30;

            const coverageDays =
                avgPerDay > 0
                    ? Math.floor(
                        Number(product.stock) /
                        avgPerDay
                    )
                    : null;

            return {
                id: product.id,
                name: product.name,
                stock: product.stock,
                coverageDays,
            };

        })
        .filter(
            (p) =>
                p.coverageDays !== null
        )
        .sort(
            (a, b) =>
                a.coverageDays -
                b.coverageDays
        )
        .slice(0, 5);



    // PURCHASE RECOMENDATION START
    const purchaseRecommendations =
        stockForecast

            .filter(
                (p) =>
                    p.estimatedDaysLeft <= 30
            )

            .map((p) => ({

                productId: p.id,

                name: p.name,

                currentStock: p.stock,

                avgDailySales:
                    Number(p.avgPerDay),

                daysRemaining:
                    p.estimatedDaysLeft,

                suggestedOrder:

                    Math.max(
                        0,

                        Math.ceil(
                            Number(p.avgPerDay) * 30
                        ) -

                        Number(p.stock)
                    ),

            }))

            .filter(
                (p) =>
                    p.suggestedOrder > 0
            )

            .sort(
                (a, b) =>
                    a.daysRemaining -
                    b.daysRemaining
            )

            .slice(0, 10);
    // PURCHASE RECOMENDATION END

    // SUPPLIER PERFORMANCE
    const purchases =
        await prisma.purchase.findMany({

            where: {
                tenantId,
            },

            include: {
                supplier: true,
            },

        });

    const supplierMap = {};

    for (const purchase of purchases) {

        const supplierId =
            purchase.supplierId;

        if (!supplierMap[supplierId]) {

            supplierMap[supplierId] = {

                supplierId,

                name:
                    purchase.supplier?.name ||
                    "Unknown",

                totalOrders: 0,

                totalSpend: 0,

            };

        }

        supplierMap[supplierId].totalOrders += 1;

        supplierMap[supplierId].totalSpend +=
            Number(
                purchase.totalAmount || 0
            );
    }

    // TOP SUPPLIERS
    const topSuppliers =
        Object.values(supplierMap)

            .sort(
                (a, b) =>
                    b.totalSpend -
                    a.totalSpend
            )

            .slice(0, 5);

    // TOP CUSTOMERS
    const topCustomers = await Promise.all(
        topCustomersRaw.map(async (item) => {

            const customer = item.customerId
                ? await prisma.customer.findUnique({
                    where: {
                        id: item.customerId,
                    },
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                    },
                })
                : null;

            return {
                customerId: item.customerId,
                customerName:
                    customer?.name ||
                    "Walk-in Customer",
                phone:
                    customer?.phone || "-",
                totalSpent:
                    Number(
                        item._sum.totalAmount || 0
                    ),
                clv:
                    Number(
                        item._sum.totalAmount || 0
                    ),
                totalOrders:
                    item._count.id || 0,

                purchaseFrequency:
                    item._count.id || 0,
            };

        })
    );

    // CUSTOMER CLV
    const customerLifetimeValue =
        await Promise.all(

            customerClvRaw.map(
                async (item) => {

                    const customer =
                        await prisma.customer.findUnique({

                            where: {
                                id: item.customerId,
                            },

                            select: {
                                id: true,
                                name: true,
                                phone: true,
                            },

                        });

                    return {

                        customerId:
                            item.customerId,

                        customerName:
                            customer?.name ||
                            "Unknown",

                        phone:
                            customer?.phone ||
                            "-",

                        totalOrders:
                            item._count.id,

                        clv:
                            Number(
                                item._sum.totalAmount || 0
                            ),

                    };

                }
            )

        );

    const totalCustomers =
        await prisma.customer.count({
            where: { tenantId },
        });

    const totalOrders =
        await prisma.sale.count({
            where: {
                tenantId,
                customerId: {
                    not: null,
                },
            },
        });

    const purchaseFrequency =
        totalCustomers > 0
            ? Number(
                (
                    totalOrders /
                    totalCustomers
                ).toFixed(2)
            )
            : 0;


    // RETENTION RATE
    const purchasingCustomers =
        customerRetentionRaw.length;

    const noPurchaseCustomers =
        totalCustomers -
        purchasingCustomers;

    const retainedCustomers =
        customerRetentionRaw.filter(
            (customer) =>
                customer._count.id > 1
        ).length;

    const retentionRate =
        purchasingCustomers > 0
            ? Number(
                (
                    (retainedCustomers /
                        purchasingCustomers) *
                    100
                ).toFixed(1)
            )
            : 0;

    //MAPPING CUSTOMERS SEGMENT
    const customerSegments =
        await Promise.all(

            customerSegmentsRaw.map(
                async (item) => {

                    const customer =
                        await prisma.customer.findUnique({

                            where: {
                                id: item.customerId,
                            },

                            select: {
                                id: true,
                                name: true,
                                phone: true,
                            },

                        });

                    const totalOrders =
                        item._count.id || 0;

                    const totalSpent =
                        Number(
                            item._sum.totalAmount || 0
                        );

                    let segment =
                        "NEW";

                    if (
                        totalOrders >= 10 ||
                        totalSpent >= 10000000
                    ) {

                        segment = "VIP";

                    } else if (
                        totalOrders >= 5
                    ) {

                        segment = "LOYAL";

                    } else if (
                        totalOrders >= 2
                    ) {

                        segment = "REGULAR";

                    }

                    return {

                        customerId:
                            item.customerId,

                        customerName:
                            customer?.name,

                        totalOrders,

                        totalSpent,

                        segment,

                    };

                }
            )

        );

    const segmentSummary = {

        vip:
            customerSegments.filter(
                c => c.segment === "VIP"
            ).length,

        loyal:
            customerSegments.filter(
                c => c.segment === "LOYAL"
            ).length,

        regular:
            customerSegments.filter(
                c => c.segment === "REGULAR"
            ).length,

        new:
            customerSegments.filter(
                c => c.segment === "NEW"
            ).length,

    };

    //CUSTOMER GROWTH
    const customers = await prisma.customer.findMany({
        where: {
            tenantId,
        },
        select: {
            createdAt: true,
        },
    });

    const customerGrowthMap = {};

    customers.forEach((customer) => {

        const date =
            new Date(customer.createdAt);

        const key =
            `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}`;

        customerGrowthMap[key] =
            (customerGrowthMap[key] || 0) + 1;

    });

    const customerGrowth =
        Object.entries(customerGrowthMap)

            .sort(
                ([a], [b]) =>
                    new Date(a) -
                    new Date(b)
            )

            .map(([monthKey, total]) => ({

                month:
                    new Date(monthKey)
                        .toLocaleDateString(
                            "en-US",
                            {
                                month: "short",
                                year: "numeric",
                            }
                        ),

                total,

            }));


    // AT RISK CUSTOMERS
    const atRiskCustomers =
        await Promise.all(

            customerRiskRaw.map(
                async (item) => {

                    const customer =
                        await prisma.customer.findUnique({

                            where: {
                                id: item.customerId,
                            },

                            select: {
                                id: true,
                                name: true,
                                phone: true,
                                email: true,
                            },

                        });

                    const lastPurchase =
                        item._max.createdAt;

                    const daysSincePurchase =
                        Math.floor(
                            (
                                Date.now() -
                                new Date(lastPurchase)
                            ) / 86400000
                        );

                    return {

                        customerId:
                            customer?.id,

                        customerName:
                            customer?.name,

                        phone:
                            customer?.phone,

                        email:
                            customer?.email,

                        lastPurchase,

                        daysSincePurchase,

                    };

                }
            )

        );

    const atRiskCustomersList =
        atRiskCustomers

            .filter(
                (c) =>
                    c.daysSincePurchase >= AT_RISK_DAYS
            )

            .sort(
                (a, b) =>
                    b.daysSincePurchase -
                    a.daysSincePurchase
            )

            .slice(0, 10);

    const atRiskCustomersCount =
        atRiskCustomersList.length;

    const customerHealth = {

        active: 0,

        atRisk: 0,

        lost: 0,

        noPurchase: 0,

    };

    for (const customer of atRiskCustomers) {

        if (
            customer.daysSincePurchase <= 30
        ) {

            customerHealth.active++;

        }

        else if (
            customer.daysSincePurchase <= 60
        ) {

            customerHealth.atRisk++;

        }

        else {

            customerHealth.lost++;

        }

    }

    customerHealth.noPurchase =
        noPurchaseCustomers;


    const insights = [];

    // INSIGHT STOCK
    if (outOfStockCount > 0) {
        insights.push({
            type: "danger",
            message: `${outOfStockCount} products are out of stock. Restock immediately to avoid lost sales.`,
        });
    }

    if (criticalStockCount > 0) {
        insights.push({
            type: "warning",
            message: `${criticalStockCount} products are running low on stock.`,
        });
    }

    // INSIGHT PROFIT
    if (netProfit < 0) {
        insights.push({
            type: "danger",
            message: `Your business is currently running at a loss (negative net profit).`,
        });
    }

    if (grossProfit > 0 && netProfit / grossProfit < 0.3) {
        insights.push({
            type: "warning",
            message: `Your expenses are eating a large portion of your profit.`,
        });
    }

    // INSIGHT TOP LOSS
    if (topLossProducts?.length > 0) {
        const worst = topLossProducts[0];

        insights.push({
            type: "warning",
            message: `${worst.name} is your worst performing product with negative margin.`,
        });
    }

    // INSIGHT DEAD STOCK
    if (deadStockProducts.length > 0) {
        insights.push({
            type: "warning",
            message:
                `${deadStockProducts.length} products have not been sold for over 30 days.`,
        });
    }

    let smartSummary = "";

    if (outOfStockCount > 0) {

        smartSummary +=
            `${outOfStockCount} products are out of stock. `;

    }

    if (criticalStockCount > 0) {

        smartSummary +=
            `${criticalStockCount} products are running low. `;

    }

    if (netProfit < 0) {

        smartSummary +=
            `Business is currently running at a loss. `;

    }

    if (topLossProducts?.length > 0) {

        smartSummary +=
            `${topLossProducts[0].name} is underperforming.`;

    }


    const result = {
        totalProducts,
        totalSuppliers,
        totalCategories,
        totalSales:
            totalSales._sum.totalAmount || 0,
        totalExpense,
        grossProfit,
        netProfit,
        totalStockItems:
            totalStockItems._sum.stock || 0,
        totalStockValue,
        lowStockCount,
        lowStockProducts,
        outOfStockCount,
        criticalStockCount,
        inventoryHealthScore,
        smartSummary:
            smartSummary ||
            "Everything looks stable in your inventory.",
        insights,
        profitPerProduct,
        topProfitProducts,
        topLossProducts,
        stockAdded,
        stockRemoved,
        stockTrend,
        deadStockProducts,
        stockForecast,
        purchaseRecommendations,
        topSuppliers,
        stockCoverage,
        inventoryTurnoverRatio,
        inventoryTurnoverStatus,
        topCustomers,
        customerLifetimeValue,
        purchaseFrequency,
        retentionRate,
        retainedCustomers,
        purchasingCustomers,
        customerSegments,
        segmentSummary,
        customerGrowth,
        atRiskCustomersCount,
        atRiskCustomers:
            atRiskCustomersList,
        customerHealth,
    };

    await redis.set(
        cacheKey,
        JSON.stringify(result),
        {
            EX: 60,
        }
    );

    return result;
};

exports.recentStockMovements =
    async (tenantId) => {

        return prisma.stockMovement.findMany({

            where: {
                tenantId,
            },

            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                    },
                },

                user: {
                    select: {
                        id: true,
                        email: true,
                        role: true,
                    },
                },
            },

            orderBy: {
                createdAt: "desc",
            },

            take: 10,

        });

    };

exports.salesChart = async (
    tenantId,
    days = 7
) => {

    const startDate = new Date();

    startDate.setDate(
        startDate.getDate() - Number(days)
    );

    const sales =
        await prisma.sale.findMany({

            where: {
                tenantId,
                createdAt: {
                    gte: startDate,
                },
            },

            select: {
                totalAmount: true,
                createdAt: true,
            },

            orderBy: {
                createdAt: "asc",
            },

        });

    const grouped = {};

    sales.forEach((sale) => {

        const date =
            sale.createdAt
                .toISOString()
                .split("T")[0];

        if (!grouped[date]) {

            grouped[date] = 0;

        }

        grouped[date] += Number(
            sale.totalAmount || 0
        );

    });

    return Object.entries(grouped).map(
        ([date, total]) => ({

            date,

            total,

        })
    );

};

exports.topSellingProducts = async (tenantId, period = "30d") => {

    const now = new Date();
    let startDate = new Date();

    if (period === "7d") {
        startDate.setDate(now.getDate() - 7);
    } else if (period === "30d") {
        startDate.setDate(now.getDate() - 30);
    } else {
        startDate = null;
    }

    const grouped = await prisma.saleItem.groupBy({
        by: ["productId"],
        where: {
            sale: {
                tenantId,
                ...(startDate && {
                    createdAt: {
                        gte: startDate,
                    },
                }),
            },
        },
        _sum: {
            quantity: true,
            subtotal: true,
        },
        orderBy: {
            _sum: {
                quantity: "desc",
            },
        },
        take: 5,
    });

    // ✅ HITUNG TOTAL SEKALI SAJA (INI YANG BENAR)
    const totalSold = grouped.reduce(
        (sum, item) => sum + Number(item._sum.quantity || 0),
        0
    );

    const result = await Promise.all(
        grouped.map(async (item) => {

            const product = await prisma.product.findUnique({
                where: { id: item.productId },
                select: {
                    id: true,
                    name: true,
                },
            });

            return {
                productId: item.productId,
                productName: product?.name || "Unknown",
                sold: item._sum.quantity || 0,
                revenue: item._sum.subtotal || 0,
                percentage: totalSold
                    ? ((item._sum.quantity / totalSold) * 100).toFixed(1)
                    : 0,
            };
        })
    );

    return result;
};

exports.revenueExpenseChart = async (
    tenantId,
    days = 30
) => {

    const startDate = new Date();

    startDate.setDate(
        startDate.getDate() -
        Number(days)
    );

    const [sales, expenses] =
        await Promise.all([

            prisma.sale.findMany({

                where: {
                    tenantId,
                    createdAt: {
                        gte: startDate,
                    },
                },

                select: {
                    totalAmount: true,
                    createdAt: true,
                },

            }),

            prisma.expense.findMany({

                where: {
                    tenantId,
                    expenseDate: {
                        gte: startDate,
                    },
                },

                select: {
                    amount: true,
                    expenseDate: true,
                },

            }),

        ]);

    const grouped = {};

    /* ===================== */
    /* SALES */
    /* ===================== */

    sales.forEach((sale) => {

        const date =
            sale.createdAt
                .toISOString()
                .split("T")[0];

        if (!grouped[date]) {

            grouped[date] = {

                date,

                revenue: 0,

                expense: 0,

            };

        }

        grouped[date].revenue +=
            Number(
                sale.totalAmount || 0
            );

    });

    /* ===================== */
    /* EXPENSE */
    /* ===================== */

    expenses.forEach((expense) => {

        const date =
            expense.expenseDate
                .toISOString()
                .split("T")[0];

        if (!grouped[date]) {

            grouped[date] = {

                date,

                revenue: 0,

                expense: 0,

            };

        }

        grouped[date].expense +=
            Number(
                expense.amount || 0
            );

    });

    return Object.values(grouped)
        .sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );

};