const { z } = require("zod");

exports.createUserSchema = z.object({
    email: z
        .string()
        .email(),

    password: z
        .string()
        .min(6),

    role: z
        .enum([
            "OWNER",
            "ADMIN",
            "CASHIER",
            "WAREHOUSE",
        ])
        .optional(),
});

exports.updateUserSchema = z.object({
    email: z.string().email(),
    role: z.enum([
        "OWNER",
        "ADMIN",
        "CASHIER",
        "WAREHOUSE",
    ]),
});

exports.changePasswordSchema = z.object({
    password: z.string().min(6),
});