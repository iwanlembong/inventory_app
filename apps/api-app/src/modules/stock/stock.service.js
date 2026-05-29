const { prisma } =
    require("@inventory/database");

const {
    createAuditLog,
} = require("../../utils/audit");
const { AUDIT_ACTIONS } = require("../../constants/audit.constants");

/* ===================================================== */
/* CREATE STOCK MOVEMENT                                 */
/* ===================================================== */
exports.create = async (
    payload,
    tenantId,
    userId
) => {
    const product =
        await prisma.product.findFirst({
            where: {
                id: payload.productId,
                tenantId,
            },
        });

    if (!product) {
        throw new Error("Product not found");
    }

    const beforeStock =
        product.stock;

    let afterStock =
        beforeStock;

    /* ====================== */
    /* STOCK IN               */
    /* ====================== */
    if (payload.type === "IN") {
        afterStock = beforeStock + payload.quantity;
    }

    /* ====================== */
    /* STOCK OUT              */
    /* ====================== */
    if (payload.type === "OUT") {
        if (beforeStock < payload.quantity) {
            throw new Error("Insufficient stock");
        }

        afterStock = beforeStock - payload.quantity;
    }

    /* ====================== */
    /* ADJUSTMENT             */
    /* ====================== */
    if (payload.type === "ADJUSTMENT") {
        afterStock = payload.quantity;
    }

    /* ====================== */
    /* TRANSACTION            */
    /* ====================== */
    const result =
        await prisma.$transaction(
            async (tx) => {
                /* UPDATE PRODUCT */
                const updatedProduct =
                    await tx.product.update({
                        where: {
                            id: payload.productId,
                        },
                        data: {
                            stock: afterStock,
                        },
                    });

                /* CREATE MOVEMENT */
                await tx.stockMovement.create({
                    data: {
                        tenantId,
                        productId: payload.productId,
                        userId, type: payload.type,
                        quantity: payload.quantity,
                        beforeStock,
                        afterStock,
                        note: payload.note,
                    },
                });

                /* AUDIT LOG */
                await createAuditLog({
                    tx,
                    tenantId,
                    userId,
                    action: AUDIT_ACTIONS.UPDATE_STOCK,
                    entity: "PRODUCT",
                    entityId: updatedProduct.id,
                    data: {
                        productId: payload.productId,
                        type: payload.type,
                        quantity: payload.quantity,
                        previousStock: beforeStock,
                        currentStock: afterStock,
                        note: payload.note,
                    },
                });
                return updatedProduct;
            });
    return result;
};

/* ===================================================== */
/* GET ALL STOCK MOVEMENTS                               */
/* ===================================================== */
exports.findAll = async (
    tenantId,
    {
        page,
        limit,
        search,
        type,
    }
) => {
    const skip =
        (page - 1) * limit;
    const where = {
        tenantId,
        ...(type && {
            type,
        }),
        ...(search && {
            product: {
                name: {
                    contains: search,
                },
            },
        }),
    };
    const [items, total] =
        await prisma.$transaction([
            prisma.stockMovement.findMany({
                where,
                include: {
                    product: true,
                    user: {
                        select: {
                            id: true,
                            email: true,
                            role: true,
                        },
                    },
                },
                skip,
                take: limit,
                orderBy: {
                    id: "desc",
                },
            }),
            prisma.stockMovement.count({
                where,
            }),
        ]);

    return {
        items,
        pagination: {
            total,
            page,
            limit,
            totalPages:
                Math.ceil(total / limit),
        },
    };
};

exports.findByProductId = async (tenantId, productId) => {
    const items = await prisma.stockMovement.findMany({
        where: {
            tenantId,
            productId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    role: true,
                },
            },
        },
        orderBy: {
            id: "desc",
        },
    });

    return items;
};