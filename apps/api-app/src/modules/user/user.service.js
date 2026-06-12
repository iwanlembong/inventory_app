const bcrypt = require("bcryptjs")

const { prisma } =
    require("@inventory/database");

const { AUDIT_ACTIONS } = require("../../constants/audit.constants");

const {
    createAuditLog,
} = require("../../utils/audit");

/* ====================== */
/* CREATE */
/* ====================== */

exports.create = async (
    payload,
    tenantId,
    userId
) => {

    const existing =
        await prisma.user.findUnique({
            where: {
                email: payload.email,
            },
        });

    if (existing) {
        throw new Error(
            "Email already exists"
        );
    }

    const hashedPassword =
        await bcrypt.hash(
            payload.password,
            10
        );

    const user = await prisma.user.create({
        data: {
            tenantId,
            email: payload.email,
            password: hashedPassword,
            role: payload.role,
        },
    });


    await createAuditLog({
        tenantId,
        userId,
        action: AUDIT_ACTIONS.CREATE_USER,
        entity: "USER",
        entityId: user.id,
        data: {
            email: user.email,
            role: user.role,
        },
    });

    return user;

};

/* ====================== */
/* FIND ALL */
/* ====================== */

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
            email: {
                contains: search,
            },
        }),

    };

    const [
        users,
        total,
    ] = await Promise.all([

        prisma.user.findMany({

            where,

            skip,

            take: limit,

            orderBy: {
                createdAt: "desc",
            },

            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            },

        }),

        prisma.user.count({
            where,
        }),

    ]);

    return {

        data: users,

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

/* ====================== */
/* FIND BY ID */
/* ====================== */

exports.findById = async (
    id,
    tenantId
) => {

    const user =
        await prisma.user.findFirst({

            where: {
                id: Number(id),
                tenantId,
            },

            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            },

        });

    if (!user) {

        throw new Error(
            "User not found"
        );

    }

    return user;

};

/* ====================== */
/* UPDATE */
/* ====================== */

exports.update = async (
    id,
    payload,
    tenantId,
    userId
) => {

    console.log(userId, ">>>> isi user id di service>>>>>")

    await exports.findById(
        id,
        tenantId
    );

    /* ====================== */
    /* PROTECT OWNER ROLE */
    /* ====================== */

    if (
        payload.role === "OWNER"
    ) {
        throw new Error(
            "Owner role cannot be assigned"
        );
    }

    const data = {

        email:
            payload.email,

        role:
            payload.role,

    };

    /* update password only if provided */

    if (
        payload.password &&
        payload.password.trim() !== ""
    ) {

        data.password =
            await bcrypt.hash(
                payload.password,
                10
            );

    }

    const updatedUser =
        await prisma.user.update({

            where: {
                id: Number(id),
            },

            data,

            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            },

        });

    await createAuditLog({

        tenantId,

        userId,

        action: AUDIT_ACTIONS.UPDATE_USER,

        entity: "USER",

        entityId: updatedUser.id,

        data: {
            email: updatedUser.email,
            role: updatedUser.role,
        },

    });

    return updatedUser;

};

/* ====================== */
/* CHANGE PASSWORD */
/* ====================== */

exports.changePassword =
    async (
        id,
        password,
        tenantId
    ) => {

        await exports.findById(
            id,
            tenantId
        );

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );

        return prisma.user.update({

            where: {
                id: Number(id),
            },

            data: {
                password:
                    hashedPassword,
            },

        });

    };

/* ====================== */
/* DELETE */
/* ====================== */

exports.remove = async (
    id,
    tenantId,
    userId
) => {

    const existing =
        await exports.findById(
            id,
            tenantId
        );

    await prisma.user.delete({

        where: {
            id: Number(id),
        },

    });

    await createAuditLog({

        tenantId,

        userId,

        action: AUDIT_ACTIONS.DELETE_USER,

        entity: "USER",

        entityId: existing.id,

        data: {
            email: existing.email,
            role: existing.role,
        },

    });

    return true;

};