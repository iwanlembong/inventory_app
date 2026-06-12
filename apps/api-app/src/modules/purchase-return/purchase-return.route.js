const express =
    require("express");

const controller =
    require("./purchase-return.controller");

const {
    authMiddleware,
} = require("../../middlewares/auth.middleware");

const {
    roleMiddleware,
} = require("../../middlewares/role.middleware");

const router =
    express.Router();

/* ====================================== */
/* PURCHASE RETURNS                       */
/* ====================================== */

router.post(
    "/",
    authMiddleware,
    controller.create
);

router.get(
    "/",
    authMiddleware,
    controller.findAll
);

/* ====================================== */
/* DOWNLOAD PDF                           */
/* ====================================== */
router.get(
    "/:id/pdf",
    authMiddleware,
    controller.downloadPdf
);

router.get(
    "/:id",
    authMiddleware,
    controller.findById
);

module.exports =
    router;