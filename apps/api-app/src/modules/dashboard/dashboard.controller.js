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

exports.recentStockMovements =
    async (req, res, next) => {

        try {

            const tenantId =
                req.user.tenantId;

            const data =
                await service
                    .recentStockMovements(
                        tenantId
                    );

            res.json({
                success: true,
                data,
            });

        } catch (err) {

            next(err);

        }

    };

exports.salesChart =
    async (req, res, next) => {

        try {

            const tenantId =
                req.user.tenantId;

            const days =
                req.query.days || 7;

            const data =
                await service.salesChart(
                    tenantId,
                    days
                );

            res.json({
                success: true,
                data,
            });

        } catch (err) {

            next(err);

        }

    };

exports.topSellingProducts = async (req, res, next) => {

    try {

        const tenantId =
            req.user.tenantId;

        const period =
            req.query.period || "30d";

        const data =
            await service.topSellingProducts(
                tenantId,
                period
            );

        res.json({

            success: true,

            data,

        });

    } catch (err) {

        next(err);

    }

};

exports.getRevenueExpenseChart =
    async (req, res) => {

        const tenantId =
            req.user.tenantId;

        const days =
            req.query.days || 30;

        const data =
            await service
                .revenueExpenseChart(
                    tenantId,
                    days
                );

        res.json(data);

    };