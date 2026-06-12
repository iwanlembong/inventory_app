
const fs = require("fs");
const path = require("path");
const { prisma } = require("@inventory/database");
const {
    createAuditLog,
} = require("../../utils/audit");
const { AUDIT_ACTIONS } = require("../../constants/audit.constants");
const { validateTenantCategory } = require("../../utils/validateTenantCategory");

exports.create = async (
    payload,
    tenantId,
    userId
) => {

    await validateTenantCategory(
        payload.categoryId,
        tenantId
    );

    const sku = payload.sku || `SKU-${Date.now()}`;

    const product =

        await prisma.product.create({

            data: {

                tenantId,

                categoryId:
                    payload.categoryId,

                name:
                    payload.name,

                slug:
                    payload.slug,

                sku,

                description:
                    payload.description,

                stock:
                    payload.stock,

                costPrice:
                    payload.costPrice,

                sellingPrice:
                    payload.sellingPrice,

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

    const categoryId =
        query.categoryId || "";

    /* ====================== */
    /* WHERE */
    /* ====================== */

    const where = {

        tenantId,

        ...(categoryId && {
            categoryId:
                Number(categoryId),
        }),

        ...(search && {

            name: {

                contains: search,

            },

        }),

    };

    /* ====================== */
    /* QUERY */
    /* ====================== */

    const [

        products,
        total,

    ] = await Promise.all([

        prisma.product.findMany({

            where,

            skip,

            take: limit,

            include: {

                category: true,

                images: true,

            },

            orderBy: {
                createdAt: "desc",
            },

        }),

        prisma.product.count({
            where,
        }),

    ]);

    return {

        data: products,

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

exports.getDropdown = async (
    tenantId
) => {

    return prisma.product.findMany({

        where: {
            tenantId,
        },

        select: {

            id: true,

            name: true,

            sku: true,

            stock: true,

            costPrice: true,

            sellingPrice: true,

        },

        orderBy: {
            name: "asc",
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

    await validateTenantCategory(
        payload.categoryId,
        tenantId
    );

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
    tenantId,
    userId
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

    await exports.findById(

        id,

        tenantId

    );

    const images =
        files.map((file) => ({

            tenantId,

            productId:
                Number(id),

            imageUrl:
                `/uploads/products/${file.filename}`,

        }));

    /* ====================== */
    /* SAVE IMAGES */
    /* ====================== */
    await prisma.productImage.createMany({

        data: images,

    });

    /* ====================== */
    /* GET PRODUCT */
    /* ====================== */
    const product =
        await prisma.product.findUnique({

            where: {

                id: Number(id),

            },

        });

    /* ====================== */
    /* AUTO SET THUMBNAIL */
    /* ====================== */

    if (

        !product.thumbnail &&

        images.length > 0

    ) {

        await prisma.product.update({

            where: {

                id: Number(id),

            },

            data: {

                thumbnail:
                    images[0].imageUrl,

            },

        });

    }

    return prisma.product.findUnique({

        where: {

            id: Number(id),

        },

        include: {

            images: true,

        },

    });

};

exports.deleteImage =
    async (

        imageId,

        tenantId

    ) => {

        const image =
            await prisma.productImage.findUnique({

                where: {

                    id: Number(imageId),

                },

                include: {

                    product: true,

                },

            });

        if (!image) {

            throw new Error(
                "Image not found"
            );

        }

        if (

            image.product.tenantId !==
            tenantId

        ) {

            throw new Error(
                "Unauthorized"
            );

        }

        /* DELETE FILE */

        const filePath =
            path.join(

                process.cwd(),

                image.imageUrl

            );

        if (
            fs.existsSync(filePath)
        ) {

            fs.unlinkSync(filePath);

        }

        /* DELETE DB */

        await prisma.productImage.delete({

            where: {

                id: Number(imageId),

            },

        });

        return true;

    };

exports.setThumbnail =
    async (
        imageId,
        tenantId
    ) => {

        /* ====================== */
        /* FIND IMAGE */
        /* ====================== */

        const image =
            await prisma.productImage.findUnique({

                where: {
                    id: Number(imageId),
                },

                include: {
                    product: true,
                },

            });

        if (!image) {

            throw new Error(
                "Image not found"
            );

        }

        /* ====================== */
        /* VALIDATE TENANT */
        /* ====================== */

        if (

            image.product.tenantId !==
            tenantId

        ) {

            throw new Error(
                "Unauthorized"
            );

        }

        /* ====================== */
        /* UPDATE THUMBNAIL */
        /* ====================== */

        await prisma.product.update({

            where: {
                id: image.productId,
            },

            data: {

                thumbnail:
                    image.imageUrl,

            },

        });

        return true;

    };