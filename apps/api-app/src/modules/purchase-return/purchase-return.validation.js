const { z } = require("zod");

exports.createPurchaseReturnSchema =
    z.object({

        purchaseId: z
            .number()
            .int()
            .positive(),

        reason: z
            .string()
            .max(500)
            .optional(),

        items: z.array(

            z.object({

                purchaseItemId: z
                    .number()
                    .int()
                    .positive(),

                quantity: z
                    .number()
                    .int()
                    .positive(),

            })

        ).min(1),

    });