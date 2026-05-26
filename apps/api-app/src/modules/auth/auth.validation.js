const { z } = require("zod");

exports.registerSchema = z.object({
  storeName: z.string().min(2),
  storeSlug: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

exports.loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});