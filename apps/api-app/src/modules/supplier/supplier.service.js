const { prisma } = require("@inventory/database");

const {
  createAuditLog,
} = require("../../utils/audit");

exports.create = async (
  payload,
  tenantId,
  userId
) => {

  const existingSupplier =
    await prisma.supplier.findFirst({
      where: {
        tenantId,
        name: payload.name,
      },
    });

  if (existingSupplier) {
    throw new Error(
      "Supplier already exists"
    );
  }

  const supplier =
    await prisma.supplier.create({

      data: {

        tenantId,

        name: payload.name,

        phone: payload.phone,

        email: payload.email,

        address: payload.address,

      },

    });


  await createAuditLog({

    tenantId,

    userId,

    action: "CREATE",

    entity: "SUPPLIER",

    entityId: supplier.id,

    data: {
      name: supplier.name,
      email: supplier.email,
    },

  });

  return supplier;

};

exports.findAll = async (
  tenantId,
  query
) => {

  const page =
    Number(query.page) || 1;

  const limit =
    Number(query.limit) || 10;

  const skip =
    (page - 1) * limit;

  const search =
    query.search || "";

  const where = {

    tenantId,

    ...(search && {

      OR: [

        {
          name: {
            contains: search,
          },
        },

        {
          email: {
            contains: search,
          },
        },

        {
          phone: {
            contains: search,
          },
        },

      ],

    }),

  };

  const [

    suppliers,
    total,

  ] = await Promise.all([

    prisma.supplier.findMany({

      where,

      skip,

      take: limit,

      orderBy: {
        id: "desc",
      },

    }),

    prisma.supplier.count({
      where,
    }),

  ]);

  return {

    data: suppliers,

    meta: {

      page,

      limit,

      total,

      totalPages:
        Math.ceil(
          total / limit
        ),

    },

  };

};

exports.findById = async (
  id,
  tenantId
) => {

  const supplier =
    await prisma.supplier.findFirst({

      where: {
        id: Number(id),
        tenantId,
      },

    });

  if (!supplier) {
    throw new Error(
      "Supplier not found"
    );
  }

  return supplier;

};

exports.update = async (
  id,
  payload,
  tenantId,
  userId
) => {

  await exports.findById(
    id,
    tenantId
  );

  const supplier =
    await prisma.supplier.update({

      where: {
        id: Number(id),
      },

      data: {

        name: payload.name,

        phone: payload.phone,

        email: payload.email,

        address: payload.address,

      },

    });

  await createAuditLog({

    tenantId,

    userId,

    action: "UPDATE",

    entity: "SUPPLIER",

    entityId: supplier.id,

    data: {
      name: supplier.name,
      email: supplier.email,
    },

  });
  return supplier;
};

exports.remove = async (
  id,
  tenantId,
  userId
) => {

  const supplier =
    await exports.findById(
      id,
      tenantId
    );

  await prisma.supplier.delete({

    where: {
      id: Number(id),
    },

  });

  await createAuditLog({

    tenantId,

    userId,

    action: "DELETE",

    entity: "SUPPLIER",

    entityId: supplier.id,

    data: {
      name: supplier.name,
      email: supplier.email,
    },

  });

  return true;

};