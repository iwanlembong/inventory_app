const service =
    require("./audit-log.service");


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

exports.findLatest = async (
    req,
    res
) => {

    try {

        const result =
            await service.findLatest(
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