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

    const totalProducts =
        await prisma.product.count({

            where: {
                tenantId,
            },

        });

    const totalSuppliers =
        await prisma.supplier.count({

            where: {
                tenantId,
            },

        });

    const totalSales =
        await prisma.sale.aggregate({

            where: {
                tenantId,
            },

            _sum: {
                totalAmount: true,
            },

        });

    const lowStockProducts =
        await prisma.product.findMany({

            where: {

                tenantId,

                stock: {
                    lte: 5,
                },

            },

            take: 10,

        });

    const result = {

        totalProducts,

        totalSuppliers,

        totalSales:
            totalSales._sum.totalAmount || 0,

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