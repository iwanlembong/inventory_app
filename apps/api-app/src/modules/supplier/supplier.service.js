const { prisma } = require("@inventory/database");

exports.create = async (
  payload,
  tenantId
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

  return prisma.supplier.create({
    data: {
      tenantId,

      name: payload.name,

      phone: payload.phone,

      email: payload.email,

      address: payload.address,
    },
  });

};

exports.findAll = async (
  tenantId
) => {

  return prisma.supplier.findMany({

    where: {
      tenantId,
    },

    orderBy: {
      id: "desc",
    },

  });

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
  tenantId
) => {

  await exports.findById(
    id,
    tenantId
  );

  return prisma.supplier.update({

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

};

exports.remove = async (
  id,
  tenantId
) => {

  await exports.findById(
    id,
    tenantId
  );

  return prisma.supplier.delete({

    where: {
      id: Number(id),
    },

  });

};