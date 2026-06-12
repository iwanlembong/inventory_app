const express =
    require("express");

const router =
    express.Router();

const controller =
    require("./expense.controller");

const { authMiddleware } = require("../../middlewares/auth.middleware");

/* ====================== */
/* EXPENSE */
/* ====================== */

router.get(
    "/",
    authMiddleware,
    controller.findAll
);

router.get(
    "/summary",
    authMiddleware,
    controller.getSummary
);

router.get(
    "/:id",
    authMiddleware,
    controller.findById
);

router.post(
    "/",
    authMiddleware,
    controller.create
);

router.put(
    "/:id",
    authMiddleware,
    controller.update
);

router.delete(
    "/:id",
    authMiddleware,
    controller.remove
);

module.exports =
    router;