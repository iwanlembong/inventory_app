const { prisma } =
    require("@inventory/database");

const {
    clearDashboardCache,
} = require("../../utils/cache");

const {
    createAuditLog,
} = require("../../utils/audit");

const { AUDIT_ACTIONS } = require("../../constants/audit.constants");


/* ====================== */
/* CREATE */
/* ====================== */

exports.create = async (
    payload,
    tenantId,
    userId
) => {

    const expense =
        await prisma.expense.create({

            data: {

                tenantId,

                category:
                    payload.category,

                description:
                    payload.description || null,

                amount:
                    payload.amount,

                expenseDate:
                    new Date(
                        payload.expenseDate
                    ),

                createdBy:
                    userId,

            },

        });

    await createAuditLog({

        tenantId,

        userId,

        action: AUDIT_ACTIONS.CREATE_EXPENSE,

        entity: "EXPENSE",

        entityId: expense.id,

        data: {

            category: expense.category,

            amount: expense.amount,

            expenseDate: expense.expenseDate,

        },

    });

    // CLEAR CATCH
    await clearDashboardCache(
        tenantId
    );

    return expense;

};

/* ====================== */
/* FIND ALL */
/* ====================== */

exports.findAll = async (
    tenantId,
    startDate,
    endDate
) => {

    const where = {
        tenantId,
    };

    if (
        startDate &&
        endDate
    ) {

        where.expenseDate = {

            gte: new Date(
                startDate
            ),

            lte: new Date(
                endDate +
                "T23:59:59"
            ),

        };

    }

    return prisma.expense.findMany({

        where,

        orderBy: {
            expenseDate: "desc",
        },

    });

};

/* ====================== */
/* FIND SUMMARY           */
/* ====================== */
exports.getSummary = async (
    tenantId,
    startDate,
    endDate
) => {

    const where = {
        tenantId,
    };

    if (
        startDate &&
        endDate
    ) {

        where.expenseDate = {

            gte: new Date(
                startDate
            ),

            lte: new Date(
                endDate +
                "T23:59:59"
            ),

        };

    }

    const result =
        await prisma.expense.aggregate({

            where,

            _sum: {
                amount: true,
            },

            _count: true,

        });

    return {

        totalExpense:
            Number(
                result._sum.amount || 0
            ),

        totalRecords:
            result._count,

    };

};


/* ====================== */
/* FIND BY ID */
/* ====================== */

exports.findById = async (
    id,
    tenantId
) => {

    return prisma.expense.findFirst({

        where: {

            id:
                Number(id),

            tenantId,

        },

    });

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

    const expense =
        await prisma.expense.findFirst({

            where: {

                id:
                    Number(id),

                tenantId,

            },

        });

    if (!expense) {

        throw new Error(
            "Expense not found"
        );

    }

    const updatedExpense =
        await prisma.expense.update({

            where: {
                id:
                    Number(id),
            },

            data: {

                category:
                    payload.category,

                description:
                    payload.description || null,

                amount:
                    payload.amount,

                expenseDate:
                    new Date(
                        payload.expenseDate
                    ),

            },

        });

    await createAuditLog({

        tenantId,

        userId,

        action: AUDIT_ACTIONS.UPDATE_EXPENSE,

        entity: "EXPENSE",

        entityId: updatedExpense.id,

        data: {

            category: updatedExpense.category,

            amount: updatedExpense.amount,

            expenseDate: updatedExpense.expenseDate,

        },


    });

    // CLEAR CATCH
    await clearDashboardCache(
        tenantId
    );

    return updatedExpense;

};

/* ====================== */
/* DELETE */
/* ====================== */

exports.remove = async (
    id,
    tenantId,
    userId
) => {

    const expense =
        await prisma.expense.findFirst({

            where: {

                id:
                    Number(id),

                tenantId,

            },

        });

    if (!expense) {

        throw new Error(
            "Expense not found"
        );

    }

    await prisma.expense.delete({

        where: {
            id:
                Number(id),
        },

    });

    await createAuditLog({

        tenantId,

        userId,

        action: AUDIT_ACTIONS.DELETE_EXPENSE,

        entity: "EXPENSE",

        entityId: expense.id,

        data: {

            category: expense.category,

            amount: expense.amount,

        },

    });

    // CLEAR CATCH
    await clearDashboardCache(
        tenantId
    );

    return {
        success: true,
    };

};