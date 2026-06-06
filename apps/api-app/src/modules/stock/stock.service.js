const { prisma } = require("@inventory/database");
const { createAuditLog } = require("../../utils/audit");
const { AUDIT_ACTIONS } = require("../../constants/audit.constants");

/* ===================================================== */
/* CREATE STOCK MOVEMENT                                 */
/* ===================================================== */
exports.create = async (payload, tenantId, userId) => {
    const product = await prisma.product.findFirst({
        where: {
            id: payload.productId,
            tenantId,
        },
    });

    if (!product) {
        throw new Error("Product not found");
    }

    const beforeStock = product.stock;

    let afterStock = beforeStock;

    const quantity = payload.quantity || 0;

    /* ===================================================== */
    /* STOCK LOGIC                                            */
    /* ===================================================== */

    switch (payload.type) {
        case "IN":
            afterStock = beforeStock + quantity;
            break;

        case "OUT":
            if (beforeStock < quantity) {
                throw new Error("Insufficient stock");
            }
            afterStock = beforeStock - quantity;
            break;

        case "ADJUSTMENT":
            afterStock = quantity;
            break;

        default:
            throw new Error("Invalid stock movement type");
    }

    /* ===================================================== */
    /* TRANSACTION                                            */
    /* ===================================================== */
    const result = await prisma.$transaction(async (tx) => {
        /* UPDATE PRODUCT STOCK */
        const updatedProduct = await tx.product.update({
            where: {
                id: payload.productId,
            },
            data: {
                stock: afterStock,
            },
        });

        /* CREATE STOCK MOVEMENT */
        await tx.stockMovement.create({
            data: {
                tenantId,
                productId: payload.productId,
                userId,

                type: payload.type,
                quantity,

                beforeStock,
                afterStock,

                note: payload.note,

                /* =============================== */
                /* NEW SaaS FIELD (IMPORTANT)     */
                /* =============================== */
                sourceType: payload.sourceType || "ADJUSTMENT",
                sourceId: payload.sourceId || null,
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
                quantity,
                beforeStock,
                afterStock,
                note: payload.note,
                sourceType: payload.sourceType,
                sourceId: payload.sourceId,
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
        page = 1,
        limit = 10,
        search,
        type,
        sourceType,
        productId,
    }
) => {
    const skip = (page - 1) * limit;

    const where = {
        tenantId,

        ...(type && { type }),

        ...(sourceType && { sourceType }),

        ...(productId && {
            productId: Number(productId),
        }),

        ...(search && {
            product: {
                name: {
                    contains: search,
                },
            },
        }),
    };

    const [items, total] = await prisma.$transaction([
        prisma.stockMovement.findMany({
            where,
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                user: {
                    select: {
                        id: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                id: "desc",
            },
            skip,
            take: limit,
        }),

        prisma.stockMovement.count({ where }),
    ]);

    return {
        items,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

/* ===================================================== */
/* GET BY PRODUCT                                         */
/* ===================================================== */
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