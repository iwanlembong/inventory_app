const { prisma } = require("@inventory/database");
const { createAuditLog } = require("../../utils/audit");
const { AUDIT_ACTIONS } = require("../../constants/audit.constants");

/* ====================================== */
/* CREATE SALE RETURN                     */
/* ====================================== */

exports.create = async (

    payload,
    tenantId,
    userId

) => {

    return prisma.$transaction(

        async (tx) => {

            /* ============================== */
            /* FIND SALE                      */
            /* ============================== */

            const sale =
                await tx.sale.findFirst({

                    where: {
                        id: payload.saleId,
                        tenantId,
                    },

                    include: {

                        items: {

                            include: {
                                product: true,
                            },

                        },

                    },

                });

            if (!sale) {

                throw new Error(
                    "Sale not found"
                );

            }

            /* ============================== */
            /* VALIDATE SALE STATUS           */
            /* ============================== */

            if (
                sale.status !== "PAID"
            ) {

                throw new Error(
                    "Only PAID sale can be returned"
                );

            }

            /* ============================== */
            /* GENERATE RETURN NUMBER         */
            /* ============================== */

            const returnNumber =
                `RET-${Date.now()}`;

            /* ============================== */
            /* CREATE HEADER                  */
            /* ============================== */

            const saleReturn =
                await tx.saleReturn.create({

                    data: {

                        tenantId,

                        saleId: sale.id,

                        returnNumber,

                        reason:
                            payload.reason,

                    },

                });

            /* ============================== */
            /* PROCESS ITEMS                  */
            /* ============================== */

            for (
                const item of payload.items
            ) {

                const saleItem =
                    sale.items.find(

                        (x) =>
                            x.id ===
                            item.saleItemId

                    );

                if (!saleItem) {

                    throw new Error(
                        "Sale item not found"
                    );

                }

                /* ========================== */
                /* CHECK PREVIOUS RETURNS     */
                /* ========================== */

                const returnedQty =
                    await tx.saleReturnItem.aggregate({

                        where: {
                            saleItemId:
                                item.saleItemId,
                        },

                        _sum: {
                            quantity: true,
                        },

                    });

                const alreadyReturned =
                    returnedQty._sum.quantity || 0;

                const remainingQty =
                    saleItem.quantity -
                    alreadyReturned;

                if (
                    item.quantity >
                    remainingQty
                ) {

                    throw new Error(
                        `${saleItem.product.name} maximum return quantity is ${remainingQty}`
                    );

                }

                /* ========================== */
                /* CREATE RETURN ITEM         */
                /* ========================== */

                await tx.saleReturnItem.create({

                    data: {

                        saleReturnId:
                            saleReturn.id,

                        saleItemId:
                            item.saleItemId,

                        quantity:
                            item.quantity,

                    },

                });

                /* ========================== */
                /* RESTORE PRODUCT STOCK      */
                /* ========================== */

                const beforeStock =
                    saleItem.product.stock;

                const afterStock =
                    beforeStock +
                    item.quantity;

                await tx.product.update({

                    where: {
                        id:
                            saleItem.productId,
                    },

                    data: {
                        stock:
                            afterStock,
                    },

                });

                /* ========================== */
                /* STOCK MOVEMENT             */
                /* ========================== */

                await tx.stockMovement.create({

                    data: {

                        tenantId,

                        productId: saleItem.productId,

                        userId,

                        type: "IN",

                        quantity: item.quantity,

                        beforeStock,

                        afterStock,

                        sourceType: "SALE_RETURN",

                        sourceId: saleReturn.id,

                        note:
                            `RETURN ${sale.invoiceNumber}`,

                    },

                });

            }

            /* ============================== */
            /* AUDIT LOG                      */
            /* ============================== */

            await createAuditLog({

                tenantId,

                userId,

                action: AUDIT_ACTIONS.RETURN_SALE,

                entity: "SALE_RETURN",

                entityId:
                    saleReturn.id,

                data: {

                    saleId:
                        sale.id,

                    returnNumber,

                },

            });

            /* ============================== */
            /* RETURN RESULT                  */
            /* ============================== */

            return await tx.saleReturn.findUnique({

                where: {
                    id:
                        saleReturn.id,
                },

                include: {

                    sale: true,

                    items: {

                        include: {

                            saleItem: {

                                include: {
                                    product: true,
                                },

                            },

                        },

                    },

                },

            });

        }

    );

};

/* ====================================== */
/* FIND ALL SALE RETURNS                  */
/* ====================================== */

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
                    returnNumber: {
                        contains: search,
                    },
                },

                {
                    sale: {
                        invoiceNumber: {
                            contains: search,
                        },
                    },
                },

            ],

        }),

    };

    const [

        items,
        total,

    ] = await Promise.all([

        prisma.saleReturn.findMany({

            where,

            skip,

            take: limit,

            include: {

                sale: {

                    select: {

                        id: true,

                        invoiceNumber: true,

                        totalAmount: true,

                        status: true,

                    },

                },

                items: true,

            },

            orderBy: {
                id: "desc",
            },

        }),

        prisma.saleReturn.count({
            where,
        }),

    ]);

    return {

        items,

        pagination: {

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

/* ====================================== */
/* FIND SALE RETURN DETAIL                */
/* ====================================== */

exports.findById = async (

    id,
    tenantId

) => {

    const saleReturn =
        await prisma.saleReturn.findFirst({

            where: {

                id: Number(id),

                tenantId,

            },

            include: {

                sale: {

                    include: {

                        items: {

                            include: {

                                product: true,

                            },

                        },

                    },

                },

                items: {

                    include: {

                        saleItem: {

                            include: {

                                product: true,

                            },

                        },

                    },

                },

            },

        });

    if (!saleReturn) {

        throw new Error(
            "Sale return not found"
        );

    }

    return saleReturn;

};
