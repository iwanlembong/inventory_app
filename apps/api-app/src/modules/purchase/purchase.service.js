const { prisma } = require("@inventory/database");
const { AUDIT_ACTIONS } = require("../../constants/audit.constants");
const { createAuditLog } = require("../../utils/audit");

/* ====================== */
/* INVOICE GENERATOR (RACE SAFE + TX SAFE) */
/* ====================== */

const generateInvoice = async (tx, tenantId) => {

    const dateStr = new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, '');

    const prefix = "PUR";

    // 🔥 ambil sequence terakhir dalam transaction context
    const lastSeq = await tx.invoiceSequence.findFirst({
        where: {
            tenantId,
            prefix,
            dateKey: dateStr,
        },
        orderBy: {
            sequence: "desc",
        },
    });

    const nextSeq = lastSeq ? lastSeq.sequence + 1 : 1;

    // 🔥 insert sequence baru dalam TX (aman dari race condition)
    await tx.invoiceSequence.create({
        data: {
            tenantId,
            prefix,
            dateKey: dateStr,
            sequence: nextSeq,
        },
    });

    return `${prefix}-${dateStr}-${String(nextSeq).padStart(4, "0")}`;
};

/* ====================== */
/* CREATE PURCHASE */
/* ====================== */

exports.create = async (
    payload,
    tenantId,
    userId
) => {

    console.log(
        "PURCHASE PAYLOAD:",
        JSON.stringify(payload, null, 2)
    );

    return prisma.$transaction(
        async (tx) => {

            /* ====================== */
            /* VALIDATE SUPPLIER */
            /* ====================== */

            const supplier =
                await tx.supplier.findFirst({
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

            /* ====================== */
            /* GENERATE INVOICE */
            /* ====================== */

            const invoiceNumber =
                await generateInvoice(
                    tx,
                    tenantId
                );

            /* ====================== */
            /* CALCULATE TOTALS */
            /* ====================== */

            let subtotal = 0;

            const discount =
                Number(
                    payload.discount || 0
                );

            const tax =
                Number(
                    payload.tax || 0
                );

            /* ====================== */
            /* CREATE PURCHASE */
            /* ====================== */

            const purchase =
                await tx.purchase.create({
                    data: {
                        tenantId,
                        supplierId:
                            payload.supplierId,
                        invoiceNumber,

                        subtotal: 0,
                        discount,
                        discountAmount: 0,

                        tax,
                        taxAmount: 0,

                        totalAmount: 0,

                        status:
                            "COMPLETED",
                    },
                });

            /* ====================== */
            /* PROCESS ITEMS */
            /* ====================== */

            for (const item of payload.items) {

                const qty =
                    Number(
                        item.quantity || 0
                    );

                const costPrice =
                    Number(
                        item.costPrice || 0
                    );

                if (
                    !Number.isFinite(qty) ||
                    qty <= 0
                ) {
                    throw new Error(
                        "Invalid quantity"
                    );
                }

                if (
                    !Number.isFinite(
                        costPrice
                    ) ||
                    costPrice < 0
                ) {
                    throw new Error(
                        "Invalid cost price"
                    );
                }

                const product =
                    await tx.product.findFirst({
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

                const currentStock =
                    product.stock;

                const newStock =
                    currentStock + qty;

                const itemSubtotal =
                    qty * costPrice;

                subtotal += itemSubtotal;

                /* ====================== */
                /* PURCHASE ITEM */
                /* ====================== */

                await tx.purchaseItem.create({
                    data: {
                        purchaseId:
                            purchase.id,
                        productId:
                            item.productId,
                        quantity: qty,
                        costPrice,
                        subtotal:
                            itemSubtotal,
                    },
                });

                /* ====================== */
                /* UPDATE PRODUCT STOCK */
                /* ====================== */

                await tx.product.update({
                    where: {
                        id: item.productId,
                    },
                    data: {
                        stock: {
                            increment: qty,
                        },
                    },
                });

                /* ====================== */
                /* STOCK MOVEMENT */
                /* ====================== */

                await tx.stockMovement.create({
                    data: {
                        tenantId,
                        productId:
                            item.productId,
                        userId,

                        type: "IN",

                        quantity: qty,

                        beforeStock:
                            currentStock,

                        afterStock:
                            newStock,

                        note:
                            `Purchase ${invoiceNumber}`,
                    },
                });
            }

            /* ====================== */
            /* FINAL CALCULATION */
            /* ====================== */

            const discountAmount =
                subtotal *
                (discount / 100);

            const taxableAmount =
                subtotal -
                discountAmount;

            const taxAmount =
                taxableAmount *
                (tax / 100);

            const totalAmount =
                taxableAmount +
                taxAmount;

            /* ====================== */
            /* UPDATE PURCHASE */
            /* ====================== */

            const updatedPurchase =
                await tx.purchase.update({
                    where: {
                        id: purchase.id,
                    },
                    data: {
                        subtotal,

                        discount,
                        discountAmount,

                        tax,
                        taxAmount,

                        totalAmount,
                    },
                });

            /* ====================== */
            /* AUDIT LOG */
            /* ====================== */

            await createAuditLog({
                tx,
                tenantId,
                userId,

                action: AUDIT_ACTIONS.CREATE_PURCHASE,

                entity: "PURCHASE",

                entityId:
                    purchase.id,

                data: {
                    invoiceNumber,

                    subtotal,

                    discount,
                    discountAmount,

                    tax,
                    taxAmount,

                    totalAmount,
                },
            });

            return updatedPurchase;
        }
    );
};

exports.findAll = async (tenantId, query) => {

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = query.search || "";

    const where = {
        tenantId,
        ...(search && {
            invoiceNumber: {
                contains: search,
            },
        }),
    };

    try {

        const [purchases, total] = await Promise.all([

            prisma.purchase.findMany({
                where,
                skip,
                take: limit,

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
            }),

            prisma.purchase.count({
                where,
            }),

        ]);

        return {
            data: purchases,
            meta: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };

    } catch (err) {
        console.error("🔥 FIND ALL PURCHASE ERROR:", err);
        throw err;
    }
};

exports.findById = async (id, tenantId) => {

    const purchase = await prisma.purchase.findFirst({
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
        throw new Error("Purchase not found");
    }

    return purchase;
};


exports.search = async (
    keyword,
    tenantId
) => {

    return prisma.purchase.findMany({

        where: {

            tenantId,

            OR: [

                {
                    invoiceNumber: {
                        contains: keyword,
                    },
                },

                {
                    supplier: {
                        name: {
                            contains: keyword,
                        },
                    },
                },

            ],

        },

        include: {
            supplier: true,
        },

        orderBy: {
            createdAt: "desc",
        },

        take: 10,

    });

};

exports.getDetailForReturn =
    async (
        purchaseId,
        tenantId
    ) => {

        const purchase =
            await prisma.purchase.findFirst({

                where: {

                    id: Number(purchaseId),

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

exports.cancel = async (
    id,
    tenantId,
    userId,
    reason
) => {

    return prisma.$transaction(

        async (tx) => {

            const purchase =
                await tx.purchase.findFirst({

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

            if (!purchase) {

                throw new Error(
                    "Purchase not found"
                );

            }

            if (
                purchase.status ===
                "CANCELLED"
            ) {

                throw new Error(
                    "Purchase already cancelled"
                );

            }

            for (
                const item of purchase.items
            ) {

                const beforeStock =
                    item.product.stock;

                const afterStock =
                    beforeStock -
                    item.quantity;

                if (afterStock < 0) {

                    throw new Error(
                        `${item.product.name} stock is not enough`
                    );

                }

                await tx.product.update({

                    where: {
                        id: item.productId,
                    },

                    data: {
                        stock: afterStock,
                    },

                });

                await tx.stockMovement.create({

                    data: {

                        tenantId,

                        productId:
                            item.productId,

                        userId,

                        type: "OUT",

                        quantity:
                            item.quantity,

                        beforeStock,

                        afterStock,

                        sourceType:
                            "PURCHASE_CANCEL",

                        sourceId:
                            purchase.id,

                        note:
                            `PURCHASE CANCEL ${purchase.invoiceNumber}`,

                    },

                });

            }

            await tx.purchase.update({

                where: {
                    id: purchase.id,
                },

                data: {
                    status:
                        "CANCELLED",
                },

            });

            /* ============================== */
            /* AUDIT LOG                      */
            /* ============================== */

            await createAuditLog({

                tenantId,

                userId,

                action:
                    AUDIT_ACTIONS.CANCEL_PURCHASE,

                entity:
                    "PURCHASE",

                entityId:
                    purchase.id,

                data: {

                    invoiceNumber:
                        purchase.invoiceNumber,

                    reason,

                },

            });

            return purchase;

        }

    );

};

