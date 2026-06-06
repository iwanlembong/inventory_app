const service = require("./sale.service");
const { createSaleSchema } = require("./sale.validation");

/* ===================================================== */
/* CREATE SALE                                           */
/* ===================================================== */
exports.create = async (req, res) => {
    try {
        const validated = createSaleSchema.parse(req.body);

        const result = await service.create(
            validated,
            req.user.tenantId,
            req.user.userId
        );

        return res.status(201).json({
            success: true,
            message: "Sale created successfully",
            data: result,
        });

    } catch (err) {
        return handleError(err, res);
    }
};

/* ===================================================== */
/* GET ALL SALES                                         */
/* ===================================================== */
exports.findAll = async (
    req,
    res
) => {

    try {

        const page =
            Number(req.query.page) || 1;

        const limit =
            Number(req.query.limit) || 10;

        const search =
            req.query.search || "";

        const result =
            await service.findAll(
                req.user.tenantId,
                {
                    page,
                    limit,
                    search,
                }
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
/* ===================================================== */
/* GET SALE BY ID                                        */
/* ===================================================== */
exports.findById = async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!id || isNaN(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid sale ID",
            });
        }

        const result = await service.findById(
            id,
            req.user.tenantId
        );

        return res.json({
            success: true,
            message: "Sale retrieved successfully",
            data: result,
        });

    } catch (err) {
        return handleError(err, res);
    }
};

/* ===================================================== */
/* CANCEL SALE                                           */
/* ===================================================== */
exports.cancelSale = async (req, res) => {
    try {
        const result = await service.cancelSale(
            req.params.id,
            req.user.tenantId,
            req.user.userId
        );

        return res.json({
            success: true,
            message: "Sale cancelled successfully",
            data: result,
        });

    } catch (err) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};

/* ===================================================== */
/* GENERATE INVOICE NUMBER                               */
/* ===================================================== */
exports.getNextInvoiceNumber = async (
    req,
    res
) => {
    try {
        const invoiceNumber =
            await service.getNextInvoiceNumber(
                req.user.tenantId
            );

        res.json({
            success: true,
            data: {
                invoiceNumber,
            },
        });

    } catch (err) {

        res.status(500).json({
            success: false,
            message: err.message,
        });

    }
};

/* ===================================================== */
/* CENTRAL ERROR HANDLER                                 */
/* ===================================================== */
function handleError(err, res) {
    const errorMap = {
        "Sale not found": 404,
        "Product not found": 404,
        "stock is insufficient": 400,
    };

    const status =
        errorMap[err.message] || 500;

    return res.status(status).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
}