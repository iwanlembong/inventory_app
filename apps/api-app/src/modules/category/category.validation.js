const { z } = require("zod");

exports.createCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name minimal 2 karakter"),

  slug: z
    .string()
    .min(2, "Slug minimal 2 karakter"),
});

exports.updateCategorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name minimal 2 karakter"),

  slug: z
    .string()
    .min(2, "Slug minimal 2 karakter"),
});