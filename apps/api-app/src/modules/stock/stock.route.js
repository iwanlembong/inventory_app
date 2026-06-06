const express = require("express");

const controller = require("./stock.controller");

const { authMiddleware } = require("../../middlewares/auth.middleware");
const { roleMiddleware } = require("../../middlewares/role.middleware");
const { ROLES } = require("../../constants/roles");

const router = express.Router();

/* ===================================================== */
/* CREATE STOCK MOVEMENT                                 */
/* ===================================================== */
router.post(
    "/",
    authMiddleware,
    roleMiddleware(
        ROLES.OWNER,
        ROLES.ADMIN,
        ROLES.WAREHOUSE
    ),
    controller.create
);

/* ===================================================== */
/* STOCK LEDGER (ALL MOVEMENTS)                         */
/* ===================================================== */
router.get(
    "/movements",
    authMiddleware,
    controller.findAll
);

/* ===================================================== */
/* STOCK HISTORY PER PRODUCT                             */
/* ===================================================== */
router.get(
    "/product/:productId",
    authMiddleware,
    controller.getByProductId
);

module.exports = router;