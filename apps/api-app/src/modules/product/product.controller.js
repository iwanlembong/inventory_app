const service = require("./product.service");

const {
    createProductSchema,
} = require("./product.validation");

exports.create = async (req, res) => {

    try {

        console.log("BODY:", req.body);

        console.log("FILES:", req.files);

        const payload = {

            ...req.body,

            categoryId:
                req.body.categoryId
                    ? Number(
                        req.body.categoryId
                    )
                    : null,

            costPrice:
                Number(
                    req.body.costPrice
                ),

            sellingPrice:
                Number(
                    req.body.sellingPrice
                ),

            stock:
                Number(
                    req.body.stock
                ),

        };


        const validated = createProductSchema.parse(payload);

        const result =
            await service.create(
                validated,
                req.user.tenantId,
                req.user.userId,
            );

        if (
            req.files &&
            req.files.length > 0
        ) {

            await service.uploadImages(

                result.id,

                req.files,

                req.user.tenantId

            );

        }

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

exports.update = async (
    req,
    res
) => {

    try {

        console.log(
            "BODY =>",
            req.body
        );

        console.log(
            "FILES =>",
            req.files
        );

        const payload = {

            ...req.body,

            categoryId:
                req.body.categoryId
                    ? Number(
                        req.body.categoryId
                    )
                    : null,

            costPrice:
                Number(
                    req.body.costPrice
                ),

            sellingPrice:
                Number(
                    req.body.sellingPrice
                ),

            stock:
                Number(
                    req.body.stock
                ),

        };

        const validated =
            createProductSchema.parse(
                payload
            );

        const result =
            await service.update(

                req.params.id,

                validated,

                req.user.tenantId,

                req.user.userId

            );

        /* ====================== */
        /* UPLOAD IMAGES */
        /* ====================== */

        if (
            req.files &&
            req.files.length > 0
        ) {

            await service.uploadImages(

                req.params.id,

                req.files,

                req.user.tenantId

            );

        }

        res.json({

            success: true,

            data: result,

        });

    } catch (err) {

        console.log(err);

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
            req.user.tenantId,
            req.user.userId
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

exports.deleteImage =
    async (req, res) => {

        try {

            const result =
                await service.deleteImage(

                    req.params.imageId,

                    req.user.tenantId

                );

            res.json({

                success: true,

                message:
                    "Image deleted",

                data: result,

            });

        } catch (err) {

            res.status(400).json({

                success: false,

                message: err.message,

            });

        }

    };

exports.setThumbnail =
    async (req, res, next) => {

        try {

            await service.setThumbnail(

                req.params.imageId,

                req.user.tenantId

            );

            res.json({

                success: true,

                message:
                    "Thumbnail updated",

            });

        } catch (err) {

            next(err);

        }

    };