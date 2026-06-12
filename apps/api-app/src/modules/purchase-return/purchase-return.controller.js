const service =
    require("./purchase-return.service");

const {
    createPurchaseReturnSchema,
} = require("./purchase-return.validation");

const {
    generatePurchaseReturnPdf,
} = require("./purchase-return.pdf");

/* ====================================== */
/* CREATE PURCHASE RETURN                 */
/* ====================================== */

exports.create =
    async (
        req,
        res
    ) => {

        try {

            const payload =
                createPurchaseReturnSchema.parse(
                    req.body
                );

            const result =
                await service.create(

                    payload,

                    req.user.tenantId,

                    req.user.userId

                );

            return res.status(201).json({

                success: true,

                message:
                    "Purchase return created successfully",

                data: result,

            });

        } catch (err) {

            console.error(err);

            return res.status(400).json({

                success: false,

                message:
                    err.message,

            });

        }

    };

/* ====================================== */
/* GET ALL PURCHASE RETURNS               */
/* ====================================== */

exports.findAll =
    async (
        req,
        res
    ) => {

        try {

            const result =
                await service.findAll(

                    req.user.tenantId,

                    req.query

                );

            return res.json({

                success: true,

                data: result,

            });

        } catch (err) {

            console.error(err);

            return res.status(400).json({

                success: false,

                message:
                    err.message,

            });

        }

    };

/* ====================================== */
/* GET PURCHASE RETURN DETAIL             */
/* ====================================== */

exports.findById =
    async (
        req,
        res
    ) => {

        try {

            const result =
                await service.findById(

                    req.params.id,

                    req.user.tenantId

                );

            return res.json({

                success: true,

                data: result,

            });

        } catch (err) {

            console.error(err);

            return res.status(400).json({

                success: false,

                message:
                    err.message,

            });

        }

    };
    

/* ====================================== */
/* DOWNLOAD PDF                           */
/* ====================================== */
exports.downloadPdf =
    async (
        req,
        res
    ) => {

        const purchaseReturn =
            await service.findById(

                req.params.id,

                req.user.tenantId

            );

        return generatePurchaseReturnPdf(
            purchaseReturn,
            res
        );

    };