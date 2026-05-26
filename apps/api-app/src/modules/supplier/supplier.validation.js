const { z } = require("zod");

exports.createSupplierSchema = z.object({

  name: z
    .string()
    .min(2, "Name minimal 2 karakter")
    .max(100, "Name maksimal 100 karakter"),

  phone: z
    .string()
    .min(6, "Phone minimal 6 digit")
    .max(20, "Phone maksimal 20 digit")
    .optional()
    .or(z.literal("")),

  email: z
    .string()
    .email("Format email tidak valid")
    .optional()
    .or(z.literal("")),

  address: z
    .string()
    .max(500, "Address terlalu panjang")
    .optional()
    .or(z.literal("")),

});