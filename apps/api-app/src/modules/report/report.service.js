const { prisma } =
    require("@inventory/database");

exports.getProfitReport = async (
    tenantId,
    startDate,
    endDate
) => {

    const where = {
        tenantId,
        status: "PAID",
    };

    if (
        startDate &&
        endDate
    ) {

        where.createdAt = {

            gte: new Date(
                startDate
            ),

            lte: new Date(
                endDate +
                "T23:59:59"
            ),

        };

    }

    const sales =
        await prisma.sale.findMany({

            where,

            include: {

                items: true,

            },

            orderBy: {

                createdAt: "asc",

            },

        });

    /* ====================== */
    /* EXPENSES */
    /* ====================== */

    const expenseWhere = {
        tenantId,
    };

    if (
        startDate &&
        endDate
    ) {

        expenseWhere.expenseDate = {

            gte: new Date(
                startDate
            ),

            lte: new Date(
                endDate +
                "T23:59:59"
            ),

        };

    }

    const expenseResult =
        await prisma.expense.aggregate({

            where:
                expenseWhere,

            _sum: {

                amount: true,

            },

        });

    const totalExpense =
        Number(
            expenseResult
                ._sum
                .amount || 0
        );

    /* ====================== */
    /* SALES */
    /* ====================== */

    let totalSales = 0;

    let totalCost = 0;

    let grossProfit = 0;

    const details = [];

    for (
        const sale of sales
    ) {

        let saleRevenue = 0;

        let saleCost = 0;

        for (
            const item of sale.items
        ) {

            const revenue =

                Number(
                    item.sellingPrice
                ) *

                item.quantity;

            const cost =

                Number(
                    item.costPrice
                ) *

                item.quantity;

            saleRevenue +=
                revenue;

            saleCost +=
                cost;

        }

        const profit =

            saleRevenue -
            saleCost;

        totalSales +=
            saleRevenue;

        totalCost +=
            saleCost;

        grossProfit +=
            profit;

        details.push({

            saleId:
                sale.id,

            invoiceNumber:
                sale.invoiceNumber,

            date:
                sale.createdAt,

            description:
                sale.invoiceNumber,

            sales:
                saleRevenue,

            cost:
                saleCost,

            profit,

        });

    }

    /* ====================== */
    /* NET PROFIT */
    /* ====================== */

    const netProfit =

        grossProfit -
        totalExpense;

    return {

        period: {

            start:
                startDate || null,

            end:
                endDate || null,

        },

        summary: {

            totalSales,

            totalPurchase:
                totalCost,

            totalCost,

            grossProfit,

            totalExpense,

            netProfit,

        },

        items:
            details,

    };

};