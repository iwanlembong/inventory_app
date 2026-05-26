const { z } = require("zod");

exports.stockSchema = z.object({

  productId: z.number(),

  type: z.enum([
    "IN",
    "OUT",
    "ADJUSTMENT",
  ]),

  quantity: z.number().positive(),

  note: z.string().optional(),

});