const { z } = require("zod");

exports.createProductSchema = z.object({
  categoryId: z.coerce.number().optional(),

  name: z.string().min(2),

  slug: z.string().min(2),

  sku: z.string().optional(),

  description: z.string().optional(),

  costPrice:
    z.coerce.number(),

  sellingPrice:
    z.coerce.number(),

  stock:
    z.coerce.number(),
});