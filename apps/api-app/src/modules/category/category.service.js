const { prisma } = require("@inventory/database");

exports.create = async (payload, tenantId) => {

  const existing = await prisma.category.findFirst({
    where: {
      tenantId,
      slug: payload.slug,
    },
  });

  if (existing) {
    throw new Error("Category slug already exists");
  }

  return prisma.category.create({
    data: {
      tenantId,
      name: payload.name,
      slug: payload.slug,
    },
  });

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
  tenantId
) => {

  await exports.findById(id, tenantId);

  return prisma.category.update({
    where: {
      id: Number(id),
    },
    data: {
      name: payload.name,
      slug: payload.slug,
    },
  });

};

exports.remove = async (
  id,
  tenantId
) => {

  await exports.findById(id, tenantId);

  return prisma.category.delete({
    where: {
      id: Number(id),
    },
  });

};