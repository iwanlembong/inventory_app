const { prisma } =
    require("@inventory/database");

exports.create = async (
    payload,
    tenantId
) => {

    const supplier =
        await prisma.supplier.findFirst({

            where: {
                id: payload.supplierId,
                tenantId,
            },

        });

    if (!supplier) {
        throw new Error(
            "Supplier not found"
        );
    }

    let totalAmount = 0;

    for (const item of payload.items) {

        totalAmount +=
            item.quantity *
            item.costPrice;

    }

    return prisma.$transaction(
        async (tx) => {

            const purchase =
                await tx.purchase.create({

                    data: {

                        tenantId,

                        supplierId:
                            payload.supplierId,

                        invoiceNumber:
                            payload.invoiceNumber,

                        totalAmount,

                        status: "COMPLETED",

                    },

                });

            for (const item of payload.items) {

                const subtotal =
                    item.quantity *
                    item.costPrice;

                await tx.purchaseItem.create({

                    data: {

                        purchaseId:
                            purchase.id,

                        productId:
                            item.productId,

                        quantity:
                            item.quantity,

                        costPrice:
                            item.costPrice,

                        subtotal,

                    },

                });

                await tx.product.update({

                    where: {
                        id: item.productId,
                    },

                    data: {
                        stock: {
                            increment:
                                item.quantity,
                        },
                    },

                });

                await tx.stockMovement.create({

                    data: {

                        tenantId,

                        productId:
                            item.productId,

                        type: "IN",

                        quantity:
                            item.quantity,

                        note:
                            `Purchase ${payload.invoiceNumber}`,

                    },

                });

            }

            return purchase;

        }
    );

};

exports.findAll = async (
    tenantId
) => {

    return prisma.purchase.findMany({

        where: {
            tenantId,
        },

        include: {
            supplier: true,

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

    const purchase =
        await prisma.purchase.findFirst({

            where: {
                id: Number(id),
                tenantId,
            },

            include: {

                supplier: true,

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

    return purchase;

};