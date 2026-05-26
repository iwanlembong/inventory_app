
const fs = require("fs");
const path = require("path");
const { prisma } = require("@inventory/database");
const {
    createAuditLog,
} = require("../../utils/audit");
const { AUDIT_ACTIONS } = require("../../constants/audit.constants");

exports.create = async (
    payload,
    tenantId,
    userId
) => {

    const sku = payload.sku || `SKU-${Date.now()}`;

    const product =
        await prisma.product.create({

            data: {

                tenantId,

                name: payload.name,

                sku: sku,

                price: payload.price,

                stock: payload.stock,

                categoryId:
                    payload.categoryId,

            },

        });

    await createAuditLog({

        tenantId,

        userId,

        action: AUDIT_ACTIONS.CREATE_PRODUCT,

        entity: "PRODUCT",

        entityId: product.id,

        data: product,

    });

    return product;

};

exports.findAll = async (tenantId) => {

    return prisma.product.findMany({
        where: {
            tenantId,
        },

        include: {
            category: true,
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

    const product =
        await prisma.product.findFirst({
            where: {
                id: Number(id),
                tenantId,
            },

            include: {
                category: true,
            },
        });

    if (!product) {
        throw new Error("Product not found");
    }

    return product;

};

exports.update = async (
    id,
    payload,
    tenantId,
    userId
) => {

    await exports.findById(id, tenantId);

    const sku = payload.sku || `SKU-${Date.now()}`;

    const product =
        await prisma.product.update({
            where: {
                id: Number(id),
            },
            data: {

                categoryId: payload.categoryId,

                name: payload.name,

                slug: payload.slug,

                sku: sku,

                description: payload.description,

                costPrice: payload.costPrice,

                sellingPrice: payload.sellingPrice,
            },

        });

    await createAuditLog({
       
        tenantId,

        userId,

        action: AUDIT_ACTIONS.UPDATE_PRODUCT,

        entity: "PRODUCT",

        entityId: product.id,

        data: product,


    });

    return product;
};

exports.remove = async (
    id,
    tenantId
) => {

    await exports.findById(id, tenantId);

    const product = await prisma.product.delete({
        where: {
            id: Number(id),
        },
    });

    await createAuditLog({
        tenantId,

        userId,

        action: AUDIT_ACTIONS.DELETE_PRODUCT,

        entity: "PRODUCT",

        entityId: product.id,

        data: product,

    });

    return product;

};

exports.uploadImages = async (
    id,
    files,
    tenantId
) => {

    await exports.findById(id, tenantId);

    const images = files.map((file) => ({
        productId: Number(id),
        imageUrl: file.filename,
    }));

    await prisma.productImage.createMany({
        data: images,
    });

    return prisma.product.findUnique({
        where: {
            id: Number(id),
        },

        include: {
            images: true,
        },
    });

};