const { z } = require("zod");

exports.createPurchaseSchema =
    z.object({

        supplierId: z.number(),

        invoiceNumber: z
            .string()
            .min(2),

        items: z.array(

            z.object({

                productId: z.number(),

                quantity: z
                    .number()
                    .positive(),

                costPrice: z
                    .number()
                    .positive(),

            })

        ).min(1),

    });