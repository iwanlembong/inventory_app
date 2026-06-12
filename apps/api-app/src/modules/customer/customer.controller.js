const customerService =
    require("./customer.service");

const {
    createCustomerSchema,
    updateCustomerSchema,
} = require("./customer.validation");

/* ====================== */
/* CREATE */
/* ====================== */

exports.create = async (
    req,
    res,
    next
) => {

    try {

        const payload =
            createCustomerSchema.parse(
                req.body
            );

        const customer =
            await customerService.create(
                payload,
                req.user.tenantId,
                req.user.userId
            );

        res.status(201).json({

            success: true,
            data: customer,

        });

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message,
        });

    }

};

/* ====================== */
/* FIND ALL */
/* ====================== */

exports.findAll = async (
    req,
    res,
    next
) => {

    try {

        const customers =
            await customerService.findAll(
                req.user.tenantId,
                req.query
            );

        res.json({

            success: true,
            data: customers.data,
            meta: customers.meta,

        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message,
        });

    }

};

/* ====================== */
/* FIND BY ID */
/* ====================== */

exports.findById = async (
    req,
    res,
    next
) => {

    try {

        const customer =
            await customerService.findById(

                req.params.id,

                req.user.tenantId

            );

        res.json({

            success: true,
            data: customer,

        });

    } catch (err) {

        res.status(404).json({
            success: false,
            message: err.message,
        });


    }

};

/* ====================== */
/* UPDATE */
/* ====================== */

exports.update = async (
    req,
    res,
    next
) => {

    try {

        const payload =
            updateCustomerSchema.parse(
                req.body
            );

        const customer =
            await customerService.update(
                req.params.id,
                payload,
                req.user.tenantId,
                req.user.userId
            );

        res.json({

            success: true,
            data: customer,

        });

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message,
        });

    }

};

/* ====================== */
/* DELETE */
/* ====================== */

exports.remove = async (
    req,
    res,
    next
) => {

    try {

        await customerService.remove(
            req.params.id,
            req.user.tenantId,
            req.user.userId
        );

        res.json({

            success: true,
            message:
                "Customer deleted successfully",

        });

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message,
        });


    }

};