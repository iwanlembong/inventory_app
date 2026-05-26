const { prisma } =
    require("@inventory/database");

exports.createAuditLog = async ({
  tx,
  
  tenantId,

  userId,

  action,

  entity,

  entityId,

  data,

}) => {

  return tx.auditLog.create({

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