const { z } = require("zod");

/* ====================== */
/* CREATE */
/* ====================== */

exports.createExpenseSchema =
    z.object({

        category: z
            .string()
            .min(2),

        description: z
            .string()
            .optional(),

        amount: z
            .number()
            .positive(),

        expenseDate: z
            .string(),

    });

/* ====================== */
/* UPDATE */
/* ====================== */

exports.updateExpenseSchema =
    z.object({

        category: z
            .string()
            .min(2),

        description: z
            .string()
            .optional(),

        amount: z
            .number()
            .positive(),

        expenseDate: z
            .string(),

    });