const service =
    require("./purchase.service");

const {
    createPurchaseSchema,
} = require("./purchase.validation");

exports.create = async (
    req,
    res
) => {

    try {

        const validated =
            createPurchaseSchema.parse(
                req.body
            );

        const result =
            await service.create(
                validated,
                req.user.tenantId
            );

        res.status(201).json({

            success: true,

            data: result,

        });

    } catch (err) {

        res.status(400).json({

            success: false,

            message: err.message,

        });

    }

};

exports.findAll = async (
    req,
    res
) => {

    try {

        const result =
            await service.findAll(
                req.user.tenantId
            );

        res.json({

            success: true,

            data: result,

        });

    } catch (err) {

        res.status(500).json({

            success: false,

            message: err.message,

        });

    }

};

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