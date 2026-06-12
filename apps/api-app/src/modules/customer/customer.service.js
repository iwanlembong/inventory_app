const { prisma } =
    require("@inventory/database");

const { AUDIT_ACTIONS } = require("../../constants/audit.constants");

const {
  createAuditLog,
} = require("../../utils/audit");

/* ====================== */
/* CREATE */
/* ====================== */

exports.create = async (
    payload,
    tenantId,
    userId
) => {

    const existingCustomer =
        await prisma.customer.findFirst({

            where: {
                tenantId,
                name: payload.name,
            },

        });

    if (existingCustomer) {

        throw new Error(
            "Customer already exists"
        );

    }

    const customer =
        await prisma.customer.create({

            data: {

                tenantId,

                name: payload.name,

                email:
                    payload.email || null,

                phone:
                    payload.phone || null,

                address:
                    payload.address || null,

                notes:
                    payload.notes || null,

            },

        });

    await createAuditLog({

        tenantId,

        userId,

        action: AUDIT_ACTIONS.CREATE_CUSTOMER,

        entity: "CUSTOMER",

        entityId: customer.id,

        data: {
            name: customer.name,
            email: customer.email,
        },

    });

    return customer;

};

/* ====================== */
/* FIND ALL */
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

    const where = {

        tenantId,

        ...(search && {

            OR: [

                {
                    name: {
                        contains: search,
                    },
                },

                {
                    email: {
                        contains: search,
                    },
                },

                {
                    phone: {
                        contains: search,
                    },
                },

            ],

        }),

    };

    const [

        customers,
        total,

    ] = await Promise.all([

        prisma.customer.findMany({

            where,

            skip,

            take: limit,

            orderBy: {
                id: "desc",
            },

        }),

        prisma.customer.count({
            where,
        }),

    ]);

    return {

        data: customers,

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
/* FIND BY ID */
/* ====================== */

exports.findById = async (
    id,
    tenantId
) => {

    const customer =
        await prisma.customer.findFirst({

            where: {
                id: Number(id),
                tenantId,
            },

        });

    if (!customer) {

        throw new Error(
            "Customer not found"
        );

    }

    return customer;

};

/* ====================== */
/* UPDATE */
/* ====================== */

exports.update = async (
    id,
    payload,
    tenantId,
    userId
) => {

    const chkcustomer =
        await prisma.customer.findFirst({

            where: {
                id: Number(id),
                tenantId,
            },

        });

    if (!chkcustomer) {

        throw new Error(
            "Customer not found"
        );

    }

    const customer =
        await prisma.customer.update({

            where: {
                id: Number(id),
            },

            data: {

                ...(payload.name && {
                    name: payload.name,
                }),

                email:
                    payload.email || null,

                phone:
                    payload.phone || null,

                address:
                    payload.address || null,

                notes:
                    payload.notes || null,

            },

        });

    await createAuditLog({

        tenantId,

        userId,

        action: AUDIT_ACTIONS.UPDATE_CUSTOMER,

        entity: "CUSTOMER",

        entityId: customer.id,

        data: {
            name: customer.name,
            email: customer.email,
        },

    });
    return customer;

};

/* ====================== */
/* DELETE */
/* ====================== */

exports.remove = async (
    id,
    tenantId,
    userId
) => {

    const customer =
        await prisma.customer.findFirst({

            where: {
                id: Number(id),
                tenantId,
            },

        });

    if (!customer) {

        throw new Error(
            "Customer not found"
        );

    }

    const usedInSales =
        await prisma.sale.count({

            where: {
                customerId:
                    Number(id),
            },

        });

    if (usedInSales > 0) {

        throw new Error(
            "Customer already used in sales transaction"
        );

    }

    return prisma.customer.delete({

        where: {
            id: Number(id),
        },

    });

    await createAuditLog({

        tenantId,

        userId,

        action: AUDIT_ACTIONS.DELETE_CUSTOMER,

        entity: "CUSTOMER",

        entityId: customer.id,

        data: {
            name: customer.name,
            email: customer.email,
        },

    });


    return true;

};