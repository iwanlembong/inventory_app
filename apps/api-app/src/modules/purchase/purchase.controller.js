const service =
    require("./purchase.service");

const {
    createPurchaseSchema,
} = require("./purchase.validation");

const {
    generatePurchasePdf,
} = require("./purchase.pdf");

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
                req.user.tenantId,
                req.user.userId
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
                req.user.tenantId,
                req.query
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

exports.downloadPdf =
    async (
        req,
        res,
        next
    ) => {

        try {

            const purchase =
                await service.findById(

                    req.params.id,

                    req.user.tenantId

                );

            if (!purchase) {

                return res.status(404)
                    .json({

                        success: false,

                        message:
                            "Purchase not found",

                    });

            }

            generatePurchasePdf(
                purchase,
                res
            );

        } catch (err) {

            next(err);

        }

    };