const { prisma } =
    require("@inventory/database");

exports.createAuditLog =
    async ({

        tx,

        tenantId,

        userId,

        action,

        entity,

        entityId,

        data,

    }) => {

        const db =
            tx || prisma;

        return db.auditLog.create({

            data: {

                tenantId,

                userId,

                action,

                entity,

                entityId,

                data,

            },

        });

};