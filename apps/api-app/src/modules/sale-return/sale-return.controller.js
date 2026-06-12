const service =
    require("./sale-return.service");

const {
    createSaleReturnSchema,
} = require("./sale-return.validation");

const {
    generateSaleReturnPdf,
} = require("./sale-return.pdf");

/* ====================================== */
/* CREATE SALE RETURN                     */
/* ====================================== */

exports.create =
    async (
        req,
        res
    ) => {

        try {

            const payload =
                createSaleReturnSchema.parse(
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
                    "Sale return created successfully",

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
/* GET ALL SALE RETURNS                   */
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
/* GET SALE RETURN DETAIL                 */
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

            return res.status(404).json({

                success: false,

                message:
                    err.errors?.[0]?.message ||
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

        const saleReturn =
            await service.findById(

                req.params.id,

                req.user.tenantId

            );

        return generateSaleReturnPdf(
            saleReturn,
            res
        );

    };