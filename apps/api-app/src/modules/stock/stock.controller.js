const service = require("./stock.service");
const { stockSchema } = require("./stock.validation");

/* ===================================================== */
/* CREATE STOCK MOVEMENT                                 */
/* ===================================================== */
exports.create = async (req, res) => {
    try {
        const validated = stockSchema.parse(req.body);

        const result = await service.create(
            validated,
            req.user.tenantId,
            req.user.userId
        );

        return res.status(201).json({
            success: true,
            message: "Stock movement created successfully",
            data: result,
        });

    } catch (err) {
        return handleError(err, res);
    }
};

/* ===================================================== */
/* GET ALL STOCK MOVEMENTS                               */
/* ===================================================== */
exports.findAll = async (req, res) => {
    try {
        const result = await service.findAll(
            req.user.tenantId,
            {
                page: Number(req.query.page) || 1,
                limit: Number(req.query.limit) || 10,
                search: req.query.search || "",
                type: req.query.type || "",
                sourceType: req.query.sourceType || "",
                productId: req.query.productId || null,
            }
        );

        return res.json({
            success: true,
            message: "Stock movements retrieved successfully",
            data: result,
        });

    } catch (err) {
        return res.status(500).json({
            success: false,
            message: err.message,
        });
    }
};

/* ===================================================== */
/* GET STOCK HISTORY BY PRODUCT                          */
/* ===================================================== */
exports.getByProductId = async (req, res) => {
    try {
        const tenantId = req.user.tenantId;
        const productId = Number(req.params.productId);

        if (!productId || isNaN(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid productId",
            });
        }

        const data = await service.findByProductId(
            tenantId,
            productId
        );

        return res.json({
            success: true,
            message: "Stock history retrieved successfully",
            data,
        });

    } catch (err) {
        return handleError(err, res);
    }
};

/* ===================================================== */
/* CENTRAL ERROR HANDLER                                 */
/* ===================================================== */
function handleError(err, res) {
    const errorMap = {
        "Product not found": 404,
        "Insufficient stock": 400,
        "Invalid stock movement type": 400,
    };

    const status = errorMap[err.message] || 500;

    return res.status(status).json({
        success: false,
        message: err.message || "Internal Server Error",
    });
}