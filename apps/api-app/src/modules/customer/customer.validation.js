const { z } = require("zod");

/* ====================== */
/* CREATE CUSTOMER */
/* ====================== */

exports.createCustomerSchema = z.object({

    name: z
        .string()
        .min(
            3,
            "Customer name must be at least 3 characters"
        )
        .max(
            100,
            "Customer name is too long"
        ),

    email: z
        .string()
        .email(
            "Invalid email address"
        )
        .optional()
        .or(z.literal("")),

    phone: z
        .string()
        .max(
            30,
            "Phone number is too long"
        )
        .optional()
        .or(z.literal("")),

    address: z
        .string()
        .max(
            255,
            "Address is too long"
        )
        .optional()
        .or(z.literal("")),

    notes: z
        .string()
        .max(
            500,
            "Notes is too long"
        )
        .optional()
        .or(z.literal("")),

});

/* ====================== */
/* UPDATE CUSTOMER */
/* ====================== */

exports.updateCustomerSchema = z.object({

    name: z
        .string()
        .min(
            3,
            "Customer name must be at least 3 characters"
        )
        .max(
            100,
            "Customer name is too long"
        )
        .optional(),

    email: z
        .string()
        .email(
            "Invalid email address"
        )
        .optional()
        .or(z.literal("")),

    phone: z
        .string()
        .max(
            30,
            "Phone number is too long"
        )
        .optional()
        .or(z.literal("")),

    address: z
        .string()
        .max(
            255,
            "Address is too long"
        )
        .optional()
        .or(z.literal("")),

    notes: z
        .string()
        .max(
            500,
            "Notes is too long"
        )
        .optional()
        .or(z.literal("")),

});