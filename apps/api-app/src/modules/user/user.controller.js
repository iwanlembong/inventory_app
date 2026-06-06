const service = require("./user.service");

const {
    createUserSchema,
    updateUserSchema,
    changePasswordSchema,
} = require("./user.validation");

/* ====================== */
/* CREATE */
/* ====================== */

exports.create = async (req, res) => {

    try {

        const validated =
            createUserSchema.parse(
                req.body
            );

        const result =
            await service.create(
                validated,
                req.user.tenantId,
                req.user.userId
            );

        res.status(201).json({

            success: true,

            message:
                "User created successfully",

            data: result,

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

        const result =
            await service.findAll(

                req.user.tenantId,

                req.query

            );

        res.json({

            success: true,

            data: result.data,

            meta: result.meta,

        });

    } catch (err) {

        next(err);

    }

};

/* ====================== */
/* FIND BY ID */
/* ====================== */

exports.findById = async (
    req,
    res
) => {

    try {

        const result =
            await service.findById(

                req.params.id,

                req.user.tenantId

            );

        res.json({

            success: true,

            data: result,

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
    res
) => {

    try {

        console.log("REQ USER:", req.user);

        const validated =
            updateUserSchema.parse(
                req.body
            );

        const result =
            await service.update(

                req.params.id,

                validated,

                req.user.tenantId,

                req.user.userId

            );

        res.json({

            success: true,

            message:
                "User updated successfully",

            data: result,

        });

    } catch (err) {

        if (err.issues) {

            return res.status(400).json({

                success: false,

                message:
                    err.issues[0].message,

            });

        }

        res.status(400).json({

            success: false,

            message: err.message,

        });


    }

};

/* ====================== */
/* CHANGE PASSWORD */
/* ====================== */

exports.changePassword = async (
    req,
    res
) => {

    try {

        const validated =
            changePasswordSchema.parse(
                req.body
            );

        await service.changePassword(

            req.params.id,

            validated.password,

            req.user.tenantId

        );

        res.json({

            success: true,

            message:
                "Password updated successfully",

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
    res
) => {

    try {

        await service.remove(

            req.params.id,

            req.user.tenantId,

            req.user.userId

        );

        res.json({

            success: true,

            message:
                "User deleted successfully",

        });

    } catch (err) {

        res.status(400).json({

            success: false,

            message: err.message,

        });

    }

};