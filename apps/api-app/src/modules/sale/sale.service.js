const { prisma } =
    require("@inventory/database");

const {
    createAuditLog,
} = require("../../utils/audit");

const { AUDIT_ACTIONS } = require("../../constants/audit.constants");


exports.create = async (
    payload,
    tenantId,
    userId
) => {

    let totalAmount = 0;

    for (const item of payload.items) {

        const product =
            await prisma.product.findFirst({

                where: {
                    id: item.productId,
                    tenantId,
                },

            });

        if (!product) {

            throw new Error(
                `Product ${item.productId} not found`
            );

        }

        if (product.stock < item.quantity) {

            throw new Error(
                `${product.name} stock is insufficient`
            );

        }

        totalAmount +=
            item.quantity *
            item.sellingPrice;

    }

    return prisma.$transaction(
        async (tx) => {

            const sale =
                await tx.sale.create({

                    data: {

                        tenantId,

                        invoiceNumber:
                            payload.invoiceNumber,

                        totalAmount,

                        status: "PAID",

                    },

                });

            for (const item of payload.items) {

                const subtotal =
                    item.quantity *
                    item.sellingPrice;

                await tx.saleItem.create({

                    data: {

                        saleId: sale.id,

                        productId:
                            item.productId,

                        quantity:
                            item.quantity,

                        sellingPrice:
                            item.sellingPrice,

                        subtotal,

                    },

                });

                await tx.product.update({

                    where: {
                        id: item.productId,
                    },

                    data: {
                        stock: {
                            decrement:
                                item.quantity,
                        },
                    },

                });

                await tx.stockMovement.create({

                    data: {

                        tenantId,

                        productId:
                            item.productId,

                        type: "OUT",

                        quantity:
                            item.quantity,

                        note:
                            `Sale ${payload.invoiceNumber}`,

                    },

                });

            }

            // =========================
            // AUDIT LOG
            // =========================

            await createAuditLog({


                tx,

                tenantId,

                userId,

                action: AUDIT_ACTIONS.CREATE_SALE,

                entity: "SALE",

                entityId: sale.id,

                data: sale,

            });

            return sale;

        }
    );

};

exports.findAll = async (
    tenantId
) => {

    return prisma.sale.findMany({

        where: {
            tenantId,
        },

        include: {

            items: {
                include: {
                    product: true,
                },
            },

        },

        orderBy: {
            id: "desc",
        },

    });

};

exports.findById = async (
    id,
    tenantId
) => {

    const sale =
        await prisma.sale.findFirst({

            where: {
                id: Number(id),
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

    return sale;

};