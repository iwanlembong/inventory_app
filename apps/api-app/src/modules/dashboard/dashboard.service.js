const { prisma } =
    require("@inventory/database");

const redis =
    require("../../lib/redis");

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

    const [
        totalProducts,
        totalSuppliers,
        totalSales,
        totalCategories,
        totalStockItems,
        lowStockCount,
        lowStockProducts,
        products,
    ] = await Promise.all([

        prisma.product.count({
            where: {
                tenantId,
            },
        }),

        prisma.supplier.count({
            where: {
                tenantId,
            },
        }),

        prisma.sale.aggregate({
            where: {
                tenantId,
            },
            _sum: {
                totalAmount: true,
            },
        }),

        prisma.category.count({
            where: {
                tenantId,
            },
        }),

        prisma.product.aggregate({
            where: {
                tenantId,
            },
            _sum: {
                stock: true,
            },
        }),

        prisma.product.count({
            where: {
                tenantId,
                stock: {
                    lte: 5,
                },
            },
        }),

        prisma.product.findMany({
            where: {
                tenantId,
                stock: {
                    lte: 5,
                },
            },
            take: 10,
        }),

        prisma.product.findMany({
            where: {
                tenantId,
            },
            select: {
                stock: true,
                costPrice: true,
            },
        }),

    ]);

    const totalStockValue =
        products.reduce(
            (sum, item) =>
                sum +
                Number(item.costPrice || 0) *
                Number(item.stock || 0),
            0
        );

    const result = {

        totalProducts,

        totalSuppliers,

        totalCategories,

        totalSales:
            totalSales._sum.totalAmount || 0,

        totalStockItems:
            totalStockItems._sum.stock || 0,

        totalStockValue,

        lowStockCount,

        lowStockProducts,

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