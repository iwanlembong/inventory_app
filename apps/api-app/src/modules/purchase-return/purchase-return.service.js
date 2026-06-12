const { prisma } = require("@inventory/database");
const { createAuditLog } = require("../../utils/audit");
const { AUDIT_ACTIONS } = require("../../constants/audit.constants");

/* ====================================== */
/* CREATE PURCHASE RETURN                 */
/* ====================================== */

exports.create = async (

    payload,
    tenantId,
    userId

) => {

    return prisma.$transaction(

        async (tx) => {

            /* ============================== */
            /* FIND PURCHASE                  */
            /* ============================== */

            const purchase =
                await tx.purchase.findFirst({

                    where: {
                        id: payload.purchaseId,
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

            if (!purchase) {

                throw new Error(
                    "Purchase not found"
                );

            }

            /* ============================== */
            /* GENERATE RETURN NUMBER         */
            /* ============================== */

            const returnNumber =
                `PRET-${Date.now()}`;

            /* ============================== */
            /* CREATE HEADER                  */
            /* ============================== */

            const purchaseReturn =
                await tx.purchaseReturn.create({

                    data: {

                        tenantId,

                        purchaseId:
                            purchase.id,

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

                const purchaseItem =
                    purchase.items.find(

                        (x) =>
                            x.id ===
                            item.purchaseItemId

                    );

                if (!purchaseItem) {

                    throw new Error(
                        "Purchase item not found"
                    );

                }

                /* ========================== */
                /* CHECK PREVIOUS RETURNS     */
                /* ========================== */

                const returnedQty =
                    await tx.purchaseReturnItem.aggregate({

                        where: {

                            purchaseItemId:
                                item.purchaseItemId,

                        },

                        _sum: {
                            quantity: true,
                        },

                    });

                const alreadyReturned =
                    returnedQty._sum.quantity || 0;

                const remainingQty =
                    purchaseItem.quantity -
                    alreadyReturned;

                if (
                    item.quantity >
                    remainingQty
                ) {

                    throw new Error(
                        `${purchaseItem.product.name} maximum return quantity is ${remainingQty}`
                    );

                }

                /* ========================== */
                /* CHECK STOCK                */
                /* ========================== */

                if (
                    purchaseItem.product.stock <
                    item.quantity
                ) {

                    throw new Error(
                        `${purchaseItem.product.name} stock is not enough`
                    );

                }

                /* ========================== */
                /* CREATE RETURN ITEM         */
                /* ========================== */

                await tx.purchaseReturnItem.create({

                    data: {

                        purchaseReturnId:
                            purchaseReturn.id,

                        purchaseItemId:
                            item.purchaseItemId,

                        quantity:
                            item.quantity,

                    },

                });

                /* ========================== */
                /* UPDATE STOCK               */
                /* ========================== */

                const beforeStock =
                    purchaseItem.product.stock;

                const afterStock =
                    beforeStock -
                    item.quantity;

                await tx.product.update({

                    where: {
                        id:
                            purchaseItem.productId,
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

                        productId:
                            purchaseItem.productId,

                        userId,

                        type: "OUT",

                        quantity:
                            item.quantity,

                        beforeStock,

                        afterStock,

                        sourceType:
                            "PURCHASE_RETURN",

                        sourceId:
                            purchaseReturn.id,

                        note:
                            `PURCHASE RETURN ${purchase.invoiceNumber}`,

                    },

                });

            }

            /* ============================== */
            /* AUDIT LOG                      */
            /* ============================== */

            await createAuditLog({

                tenantId,

                userId,

                action:
                    AUDIT_ACTIONS.RETURN_PURCHASE,

                entity:
                    "PURCHASE_RETURN",

                entityId:
                    purchaseReturn.id,

                data: {

                    purchaseId:
                        purchase.id,

                    returnNumber,

                },

            });

            /* ============================== */
            /* RETURN RESULT                  */
            /* ============================== */

            return await tx.purchaseReturn.findUnique({

                where: {
                    id:
                        purchaseReturn.id,
                },

                include: {

                    purchase: true,

                    items: {

                        include: {

                            purchaseItem: {

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
/* FIND ALL PURCHASE RETURNS              */
/* ====================================== */

exports.findAll = async (

    tenantId,
    {
        page = 1,
        limit = 10,
        search = "",
    }

) => {

    page = Number(page);
    limit = Number(limit);

    const skip =
        (page - 1) * limit;

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
                    purchase: {
                        invoiceNumber: {
                            contains: search,
                        },
                    },
                },

                {
                    purchase: {
                        supplier: {
                            name: {
                                contains: search,
                            },
                        },
                    },
                },

            ],

        }),

    };

    const [items, total] =
        await prisma.$transaction([

            prisma.purchaseReturn.findMany({

                where,

                include: {

                    purchase: {

                        include: {

                            supplier: true,

                            items: {
                                include: {
                                    product: true,
                                },
                            },

                        },

                    },

                    items: {

                        include: {

                            purchaseItem: {

                                include: {
                                    product: true,
                                },

                            },

                        },

                    },

                },

                orderBy: {
                    createdAt: "desc",
                },

                skip,
                take: limit,

            }),

            prisma.purchaseReturn.count({
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
/* FIND PURCHASE RETURN DETAIL            */
/* ====================================== */

exports.findById = async (

    id,
    tenantId

) => {

    const purchaseReturn =
        await prisma.purchaseReturn.findFirst({

            where: {
                id: Number(id),
                tenantId,
            },

            include: {

                purchase: {

                    include: {
                        supplier: true,
                    },

                },

                items: {

                    include: {

                        purchaseItem: {

                            include: {
                                product: true,
                            },

                        },

                    },

                },

            },

        });

    if (!purchaseReturn) {

        throw new Error(
            "Purchase Return not found"
        );

    }

    return purchaseReturn;

};



