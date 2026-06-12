const { z } = require("zod");

exports.createSaleReturnSchema =
    z.object({

        saleId: z
            .number()
            .int()
            .positive(),

        reason: z
            .string()
            .max(500)
            .optional(),

        items: z.array(

            z.object({

                saleItemId: z
                    .number()
                    .int()
                    .positive(),

                quantity: z
                    .number()
                    .int()
                    .positive(),

            })

        )
            .min(1, "At least one item is required"),

    });