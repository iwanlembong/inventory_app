const { prisma } =
    require("@inventory/database");

exports.findAll = async (
    tenantId
) => {

    return prisma.auditLog.findMany({

        where: {
            tenantId,
        },

        orderBy: {
            createdAt: "desc",
        },

        take: 100,

    });

};

exports.findById = async (
    id,
    tenantId
) => {

    const log =
        await prisma.auditLog.findFirst({

            where: {
                id: Number(id),
                tenantId,
            },

        });

    if (!log) {

        throw new Error(
            "Audit log not found"
        );

    }

    return log;

};