const service = require("./product.service");

const {
    createProductSchema,
} = require("./product.validation");

exports.create = async (req, res) => {

    try {

        const validated =
            createProductSchema.parse(req.body);

        const result =
            await service.create(
                validated,
                req.user.tenantId,
                req.user.userId,
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

exports.findAll = async (req, res) => {

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

exports.findById = async (req, res) => {

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

exports.update = async (req, res) => {

    try {

        const validated =
            createProductSchema.parse(req.body);

        const result =
            await service.update(
                req.params.id,
                validated,
                req.user.tenantId,
                req.user.userId,
            );

        res.json({
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

exports.remove = async (req, res) => {

    try {

        await service.remove(
            req.params.id,
            req.user.tenantId
        );

        res.json({
            success: true,
            message: "Product deleted successfully",
        });

    } catch (err) {

        res.status(400).json({
            success: false,
            message: err.message,
        });

    }

};

exports.uploadImages = async (
    req,
    res
) => {

    try {

        const result =
            await service.uploadImages(
                req.params.id,
                req.files,
                req.user.tenantId
            );

        res.json({
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
