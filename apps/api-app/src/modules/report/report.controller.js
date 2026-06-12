const service = require("./report.service");
const { generateProfitPdf, } = require("./report.pdf");

exports.getProfitReport =
    async (
        req,
        res
    ) => {

        try {

            const tenantId =
                req.user.tenantId;

            const {
                startDate,
                endDate,
            } = req.query;

            const data =
                await service.getProfitReport(
                    tenantId,
                    startDate,
                    endDate
                );


                console.log(data, "isi data>>>>")

            return res.json({
                success: true,
                data,
            });

        } catch (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message:
                    err.message,
            });

        }

    };


exports.downloadProfitPdf =
    async (
        req,
        res
    ) => {

        try {

            const tenantId =
                req.user.tenantId;

            const {
                startDate,
                endDate,
            } = req.query;

            const report =
                await service.getProfitReport(

                    tenantId,

                    startDate,

                    endDate

                );

            generateProfitPdf(
                report,
                res
            );

        } catch (err) {

            res.status(500).json({

                success: false,

                message:
                    err.message,

            });

        }

    };