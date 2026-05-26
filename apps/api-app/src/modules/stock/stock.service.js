const { prisma } =
    require("@inventory/database");

const {
    createAuditLog,
} = require("../../utils/audit");
const { AUDIT_ACTIONS } = require("../../constants/audit.constants");

exports.create = async (
    payload,
    tenantId
) => {

    const product =
        await prisma.product.findFirst({
            where: {
                id: payload.productId,
                tenantId,
                userId
            },
        });

    if (!product) {
        throw new Error("Product not found");
    }

    let updatedStock = product.stock;

    if (payload.type === "IN") {
        updatedStock += payload.quantity;
    }

    if (payload.type === "OUT") {

        if (product.stock < payload.quantity) {
            throw new Error("Insufficient stock");
        }

        updatedStock -= payload.quantity;
    }

    if (payload.type === "ADJUSTMENT") {
        updatedStock = payload.quantity;
    }

    await prisma.stockMovement.create({
        data: {
            tenantId,

            productId: payload.productId,

            type: payload.type,

            quantity: payload.quantity,

            note: payload.note,
        },
    });

    const updatedProduct =
        await prisma.product.update({
            where: {
                id: payload.productId,
            },

            data: {
                stock: updatedStock,
            },
        });

    await createAuditLog({
        tx,

        tenantId,

        userId,

        action: AUDIT_ACTIONS.UPDATE_STOCK,

        entity: "PRODUCT",

        entityId: updatedProduct.id,

        data: {

            productId:
                payload.productId,

            type:
                payload.type,

            quantity:
                payload.quantity,

            previousStock:
                product.stock,

            currentStock:
                updatedProduct.stock,

            note:
                payload.note,

        },

    });

    return updatedProduct
};

exports.findAll = async (
    tenantId
) => {

    return prisma.stockMovement.findMany({

        where: {
            tenantId,
        },

        include: {
            product: true,
        },

        orderBy: {
            id: "desc",
        },

    });

};