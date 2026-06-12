const express =
    require("express");

const controller =
    require("./report.controller");

const { authMiddleware } = require("../../middlewares/auth.middleware");

const router =
    express.Router();

/* ============================== */
/* PROFIT REPORT */
/* ============================== */

router.get(
    "/profit",
    authMiddleware,
    controller.getProfitReport
);

router.get(
    "/profit/pdf",
    authMiddleware,
    controller.downloadProfitPdf
);

module.exports =
    router;