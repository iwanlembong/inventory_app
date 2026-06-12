const { prisma } = require("@inventory/database");
const { createAuditLog } = require("../../utils/audit");
const { AUDIT_ACTIONS } = require("../../constants/audit.constants");

/* ===================================================== */
/* CREATE SALE (SAAS READY)                              */
/* ===================================================== */
exports.create = async (payload, tenantId, userId) => {
    return await prisma.$transaction(async (tx) => {

        let totalAmount = 0;

        /* =============================== */
        /* 1. CREATE SALE HEADER          */
        /* =============================== */
        const sale = await tx.sale.create({
            data: {
                tenantId,
                invoiceNumber: payload.invoiceNumber,
                customerId: payload.customerId || null,
                userId,
                totalAmount: 0, // update later
                status: "PAID",
            },
        });

        /* =============================== */
        /* 2. PROCESS ITEMS               */
        /* =============================== */
        for (const item of payload.items) {

            const product = await tx.product.findFirst({
                where: {
                    id: item.productId,
                    tenantId,
                },
            });

            if (!product) {
                throw new Error(`Product ${item.productId} not found`);
            }

            if (product.stock < item.quantity) {
                throw new Error(
                    `${product.name} stock is insufficient`
                );
            }

            const subtotal = item.quantity * item.sellingPrice;
            totalAmount += subtotal;

            const beforeStock = product.stock;
            const afterStock = beforeStock - item.quantity;

            /* =============================== */
            /* 3. CREATE SALE ITEM            */
            /* =============================== */
            await tx.saleItem.create({
                data: {
                    saleId: sale.id,
                    productId: item.productId,
                    quantity: item.quantity,
                    costPrice: item.costPrice,
                    sellingPrice: item.sellingPrice,
                    subtotal,
                },
            });

            /* =============================== */
            /* 4. UPDATE STOCK                */
            /* =============================== */
            await tx.product.update({
                where: {
                    id: item.productId,
                },
                data: {
                    stock: afterStock,
                },
            });

            /* =============================== */
            /* 5. STOCK MOVEMENT (OUT)        */
            /* =============================== */
            await tx.stockMovement.create({
                data: {
                    tenantId,
                    productId: item.productId,
                    userId,

                    type: "OUT",
                    quantity: item.quantity,

                    beforeStock,
                    afterStock,

                    sourceType: "SALE",
                    sourceId: sale.id,

                    note: `Sale: ${payload.invoiceNumber}`,
                },
            });
        }

        /* =============================== */
        /* 6. UPDATE TOTAL SALE            */
        /* =============================== */
        const updatedSale = await tx.sale.update({
            where: { id: sale.id },
            data: {
                totalAmount,
            },
            include: {
                items: true,
            },
        });

        /* =============================== */
        /* 7. AUDIT LOG                   */
        /* =============================== */
        await createAuditLog({
            tx,
            tenantId,
            userId,
            action: AUDIT_ACTIONS.CREATE_SALE,
            entity: "SALE",
            entityId: sale.id,
            data: {
                invoiceNumber: payload.invoiceNumber,
                totalAmount,
                itemsCount: payload.items.length,
            },
        });

        return updatedSale;
    });
};

/* ===================================================== */
/* FIND ALL SALES                                        */
/* ===================================================== */
exports.findAll = async (
    tenantId,
    {
        page = 1,
        limit = 10,
        search = "",
    }
) => {

    const skip =
        (page - 1) * limit;

    const where = {

        tenantId,

        ...(search && {

            invoiceNumber: {

                contains: search,

            },

        }),

    };

    const [items, total] =
        await prisma.$transaction([

            prisma.sale.findMany({

                where,

                include: {
                    customer: {
                        select: {
                            id: true,
                            name: true,
                        },
                    },

                    items: {

                        include: {

                            product: true,

                        },

                    },

                },

                skip,

                take: limit,

                orderBy: {

                    id: "desc",

                },

            }),

            prisma.sale.count({

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
                Math.ceil(
                    total / limit
                ),

        },

    };

};

/* ===================================================== */
/* FIND BY ID                                            */
/* ===================================================== */
exports.findById = async (id, tenantId) => {
    const sale = await prisma.sale.findFirst({
        where: {
            id: Number(id),
            tenantId,
        },
        include: {
            customer: true,

            items: {
                include: {
                    product: true,
                },
            },
        },
    });

    if (!sale) {
        throw new Error("Sale not found");
    }

    return sale;
};

/* ===================================================== */
/* CANCEL SALE                                           */
/* ===================================================== */
exports.cancelSale = async (saleId, tenantId, userId) => {
    return await prisma.$transaction(async (tx) => {

        const sale = await tx.sale.findFirst({
            where: {
                id: Number(saleId),
                tenantId,
            },
            include: {
                customer: true,
                items: true,
            },
        });

        if (!sale) {
            throw new Error("Sale not found");
        }

        if (sale.status === "CANCELLED") {
            throw new Error("Sale already cancelled");
        }

        if (sale.status !== "PAID") {
            throw new Error("Only PAID sales can be cancelled");
        }

        /* =============================== */
        /* 1. UPDATE STATUS               */
        /* =============================== */
        await tx.sale.update({
            where: { id: sale.id },
            data: {
                status: "CANCELLED",
            },
        });

        /* =============================== */
        /* 2. ROLLBACK STOCK              */
        /* =============================== */
        for (const item of sale.items) {

            const product = await tx.product.findFirst({
                where: {
                    id: item.productId,
                    tenantId,
                },
            });

            if (!product) {
                throw new Error(`Product not found ${item.productId}`);
            }

            const beforeStock = product.stock;
            const afterStock = beforeStock + item.quantity;

            /* =============================== */
            /* RESTORE STOCK                  */
            /* =============================== */
            await tx.product.update({
                where: { id: item.productId },
                data: {
                    stock: afterStock,
                },
            });

            /* =============================== */
            /* STOCK MOVEMENT REVERSAL        */
            /* =============================== */
            await tx.stockMovement.create({
                data: {
                    tenantId,
                    productId: item.productId,
                    userId,

                    type: "IN",
                    quantity: item.quantity,

                    beforeStock,
                    afterStock,

                    sourceType: "SALE",
                    sourceId: sale.id,

                    note: `CANCEL SALE ${sale.invoiceNumber}`,
                },
            });
        }

        /* =============================== */
        /* AUDIT LOG                      */
        /* =============================== */
        await createAuditLog({
            tx,
            tenantId,
            userId,
            action: AUDIT_ACTIONS.CANCEL_SALE,
            entity: "SALE",
            entityId: sale.id,
            data: {
                invoiceNumber: sale.invoiceNumber,
                status: "CANCELLED",
            },
        });

        return {
            message: "Sale cancelled successfully",
            saleId: sale.id,
        };
    });
};

/* ===================================================== */
/* GENERATE INVOICE NUMBER SALE                          */
/* ===================================================== */

exports.getNextInvoiceNumber = async (tenantId) => {
    const lastSale = await prisma.sale.findFirst({
        where: {
            tenantId,
        },
        orderBy: {
            id: "desc",
        },
    });

    const nextNumber = (lastSale?.id || 0) + 1;

    return `SAL-${String(nextNumber).padStart(6, "0")}`;
};