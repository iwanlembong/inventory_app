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

exports.search = async (
    req,
    res,
    next
) => {

    try {

        const result =
            await service.search(

                req.query.q || "",

                req.user.tenantId

            );

        res.json({
            success: true,
            data: result,
        });

    } catch (err) {

        next(err);

    }

};

/* ====================================== */
/* DEATIL FOR RETURN                      */
/* ====================================== */
exports.getDetailForReturn =
    async (
        req,
        res,
        next
    ) => {

        try {

            const result =
                await service.getDetailForReturn(
                    Number(req.params.id),
                    req.user.tenantId
                );

            res.json({
                success: true,
                data: result,
            });

        } catch (err) {

            next(err);

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

exports.cancel = async (req, res) => {

    const result =
        await service.cancel(

            req.params.id,

            req.user.tenantId,

            req.user.userId,

            req.body.reason

        );

    res.json({

        success: true,

        message:
            "Purchase cancelled",

        data: result,

    });

};