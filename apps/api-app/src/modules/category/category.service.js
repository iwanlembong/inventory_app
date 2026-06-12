const { prisma } = require("@inventory/database");

const { AUDIT_ACTIONS } = require("../../constants/audit.constants");

const {
  createAuditLog,
} = require("../../utils/audit");

exports.create = async (
  payload,
  tenantId,
  userId
) => {

  const existingCategory =
    await prisma.category.findFirst({
      where: {
        tenantId,
        name: payload.name,
      },
    });

  if (existingCategory) {
    throw new Error(
      "Category already exists"
    );
  }

  const category =
    await prisma.category.create({

      data: {

        tenantId,

        name: payload.name,

        slug: payload.slug,

      },

    });


  await createAuditLog({

    tenantId,

    userId,

    action: AUDIT_ACTIONS.CREATE_CATEGORY,

    entity: "CATEGORY",

    entityId: category.id,

    data: {
      name: category.name,
      slug: category.slug,
    },

  });

  return category;

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

  /* ====================== */
  /* WHERE */
  /* ====================== */

  const where = {

    tenantId,

    ...(search && {

      name: {

        contains: search,

      },

    }),

  };

  /* ====================== */
  /* QUERY */
  /* ====================== */

  const [

    categories,
    total,

  ] = await Promise.all([

    prisma.category.findMany({

      where,

      skip,

      take: limit,

      orderBy: {
        createdAt: "desc",
      },

    }),

    prisma.category.count({
      where,
    }),

  ]);

  return {

    data: categories,

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

exports.findById = async (id, tenantId) => {

  const category = await prisma.category.findFirst({
    where: {
      id: Number(id),
      tenantId,
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  return category;

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

  const category =
    await prisma.category.update({

      where: {
        id: Number(id),
      },

      data: {

        name: payload.name,

        slug: payload.slug,

      },

    });

  await createAuditLog({

    tenantId,

    userId,

    action: AUDIT_ACTIONS.UPDATE_CATEGORY,

    entity: "CATEGORY",

    entityId: category.id,

    data: {
      name: category.name,
      slug: category.slug,
    },

  });
  return category;
};

exports.remove = async (
  id,
  tenantId,
  userId
) => {

  const category =
    await exports.findById(
      id,
      tenantId
    );

  await prisma.category.delete({

    where: {
      id: Number(id),
    },

  });

  await createAuditLog({

    tenantId,

    userId,

    action: AUDIT_ACTIONS.DELETE_CATEGORY,

    entity: "CATEGORY",

    entityId: category.id,

    data: {
      name: category.name,
      slug: category.slug,
    },

  });

  return true;

};