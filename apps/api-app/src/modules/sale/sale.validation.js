const { z } = require("zod");

exports.createSaleSchema =
    z.object({

        invoiceNumber: z
            .string()
            .min(2),

        customerId: z
            .number()
            .optional()
            .nullable(),

        items: z.array(

            z.object({

                productId: z.number(),

                quantity: z
                    .number()
                    .positive(),

                sellingPrice: z
                    .number()
                    .positive(),

            })

        ).min(1),

    });