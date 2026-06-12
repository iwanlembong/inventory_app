const express = require("express");

const controller =
    require("./sale-return.controller");

const {
    authMiddleware,
} = require("../../middlewares/auth.middleware");

const {
    roleMiddleware,
} = require("../../middlewares/role.middleware");

const router =
    express.Router();

/* ====================================== */
/* CREATE SALE RETURN                     */
/* ====================================== */
router.post(
    "/",
    authMiddleware,
    roleMiddleware(
        "OWNER",
        "ADMIN",
        "CASHIER"
    ),
    controller.create
);

/* ====================================== */
/* GET ALL SALE RETURNS                   */
/* ====================================== */
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

/* ====================================== */
/* GET SALE RETURN DETAIL                 */
/* ====================================== */
router.get(
    "/:id",
    authMiddleware,
    controller.findById
);

module.exports = router;