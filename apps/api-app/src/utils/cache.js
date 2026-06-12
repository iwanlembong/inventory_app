const redis =
    require("../lib/redis");

    exports.clearDashboardCache =
    async (tenantId) => {

        await redis.del(
            `dashboard:${tenantId}`
        );

    };