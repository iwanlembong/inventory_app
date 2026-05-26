const service =
    require("./dashboard.service");

exports.summary = async (
    req,
    res
) => {

    try {

        const result =
            await service.summary(
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