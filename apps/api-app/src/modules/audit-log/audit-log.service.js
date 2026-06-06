const { prisma } =
    require("@inventory/database");


/* ====================== */
/* CREATE LOG */
/* ====================== */

exports.createLog = async ({
    tenantId,
    userId,
    action,
    entity,
    entityId = null,
    data = null,
}) => {

    return prisma.auditLog.create({

        data: {
            tenantId,
            userId,
            action,
            entity,
            entityId,
            data,
        },

    });

};

/* ====================== */
/* GET ALL */
/* ====================== */
exports.findAll = async (

    tenantId,
    query

) => {

    const page =
        Number(query.page) || 1;

    const limit =
        Number(query.limit) || 10;

    const skip =
        (page - 1) * limit;

    const search =
        query.search || "";

    const entity =
        query.entity || "";

    /* ====================== */
    /* WHERE */
    /* ====================== */

    const where = {

        tenantId,

        ...(entity && {
            entity,
        }),

        ...(search && {

            OR: [

                {
                    action: {
                        contains: search,
                    },
                },

                {
                    entity: {
                        contains: search,
                    },
                },

            ],

        }),

    };

    console.log(where, ">>>> isi where >>>>");

    /* ====================== */
    /* QUERY */
    /* ====================== */

    const [

        auditlogs,
        total,

    ] = await Promise.all([

        prisma.auditLog.findMany({

            where,

            skip,

            take: limit,

            orderBy: {
                createdAt: "desc",
            },

        }),

        prisma.auditLog.count({
            where,
        }),

    ]);

    return {

        data: auditlogs,

        meta: {

            page,

            limit,

            total,

            totalPages:
                Math.ceil(
                    total / limit
                ),

        },

    };

};

/* ====================== */
/* GET BY ID */
/* ====================== */
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

/* ====================== */
/* Activity Feed */
/* ====================== */
exports.findLatest = async (
    tenantId,
    limit = 10
) => {

    return prisma.auditLog.findMany({

        where: {
            tenantId,
        },

        orderBy: {
            createdAt: "desc",
        },

        take: limit,

    });

};