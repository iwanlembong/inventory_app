const expenseService =
    require("./expense.service");

const {
    createExpenseSchema,
    updateExpenseSchema,
} = require("./expense.validation");

/* ====================== */
/* CREATE */
/* ====================== */

exports.create =
    async (
        req,
        res,
        next
    ) => {

        try {

            const payload =
                createExpenseSchema.parse(
                    req.body
                );

            const expense =
                await expenseService.create(

                    payload,

                    req.user.tenantId,

                    req.user.userId

                );

            res.status(201).json(
                expense
            );

        } catch (err) {

            next(err);

        }

    };

/* ====================== */
/* FIND ALL */
/* ====================== */

exports.findAll =
    async (
        req,
        res,
        next
    ) => {

        try {

            const {
                startDate,
                endDate,
            } = req.query;

            const expenses =
                await expenseService.findAll(

                    req.user.tenantId,

                    startDate,

                    endDate

                );

            res.json(
                expenses
            );

        } catch (err) {

            next(err);

        }

    };

/* ====================== */
/* FIND BY ID */
/* ====================== */

exports.findById =
    async (
        req,
        res,
        next
    ) => {

        try {

            const expense =
                await expenseService.findById(

                    req.params.id,

                    req.user.tenantId

                );

            if (!expense) {

                return res
                    .status(404)
                    .json({

                        message:
                            "Expense not found",

                    });

            }

            res.json(
                expense
            );

        } catch (err) {

            next(err);

        }

    };

/* ====================== */
/* SUMMARY */
/* ====================== */

exports.getSummary =
    async (
        req,
        res,
        next
    ) => {

        try {

            const {
                startDate,
                endDate,
            } = req.query;

            const summary =
                await expenseService.getSummary(

                    req.user.tenantId,

                    startDate,

                    endDate

                );

            res.json(
                summary
            );

        } catch (err) {

            next(err);

        }

    };

/* ====================== */
/* UPDATE */
/* ====================== */

exports.update =
    async (
        req,
        res,
        next
    ) => {

        try {

            const payload =
                updateExpenseSchema.parse(
                    req.body
                );

            const expense =
                await expenseService.update(

                    req.params.id,

                    payload,

                    req.user.tenantId,

                    req.user.userId

                );

            res.json(
                expense
            );

        } catch (err) {

            next(err);

        }

    };

/* ====================== */
/* DELETE */
/* ====================== */

exports.remove =
    async (
        req,
        res,
        next
    ) => {

        try {

            const result =
                await expenseService.remove(

                    req.params.id,

                    req.user.tenantId,

                    req.user.userId

                );

            res.json(
                result
            );

        } catch (err) {

            next(err);

        }

    };