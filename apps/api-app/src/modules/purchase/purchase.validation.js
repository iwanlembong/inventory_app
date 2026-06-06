const { z } = require("zod");

exports.createPurchaseSchema =
    z.object({

        supplierId: z.number({
            required_error:
                "Supplier is required",
        }),

        invoiceNumber:
            z.string().optional(),

        discount:
            z.number()
                .min(0)
                .default(0),

        tax:
            z.number()
                .min(0)
                .default(11),

        items: z.array(

            z.object({

                productId: z.number(),

                quantity: z.number().positive(),

                costPrice: z.number().positive(),

            })

        ).min(1),

    });