const express = require("express");

const controller = require("./sale.controller");

const { authMiddleware } = require("../../middlewares/auth.middleware");
const { roleMiddleware } = require("../../middlewares/role.middleware");

const router = express.Router();

/* ===================================================== */
/* CREATE SALE                                           */
/* ===================================================== */
router.post(
  "/",
  authMiddleware,
  roleMiddleware("OWNER", "ADMIN", "CASHIER"),
  controller.create
);

/* ===================================================== */
/* GET ALL SALES                                         */
/* ===================================================== */
router.get(
  "/",
  authMiddleware,
  controller.findAll
);

/* ===================================================== */
/* GENERATE INVOICE NUMBER                               */
/* ===================================================== */
router.get(
  "/next-invoice",
  authMiddleware,
  controller.getNextInvoiceNumber
);

/* ===================================================== */
/* DOWNLOAD PDF                                          */
/* ===================================================== */
router.get(
    "/:id/pdf",
    authMiddleware,
    controller.downloadPdf
);

/* ===================================================== */
/* GET SALE BY ID                                        */
/* ===================================================== */
router.get(
  "/:id",
  authMiddleware,
  controller.findById
);

/* ===================================================== */
/* CANCEL SALE BY ID                                     */
/* ===================================================== */
router.post(
  "/:id/cancel",
  authMiddleware,
  roleMiddleware("OWNER", "ADMIN"),
  controller.cancelSale
);

/* ===================================================== */
/* DOWNLOAD PDF                                          */
/* ===================================================== */
// router.get(
//   "/:id/pdf",
//   authMiddleware,
//   controller.downloadPdf
// );


module.exports = router;