const express = require("express");

const controller =
  require("./dashboard.controller");

const {
  authMiddleware,
} = require("../../middlewares/auth.middleware");

const {
  roleMiddleware,
} = require(
  "../../middlewares/role.middleware"
);
const { ROLES } = require("../../constants/roles");

const router = express.Router();

router.get(
  "/summary",
  authMiddleware,
  roleMiddleware(
    ROLES.OWNER,
    ROLES.ADMIN,
    ROLES.CASHIER
  ),
  controller.summary
);

router.get(
    "/recent-stock-movements",
    authMiddleware,
    controller.recentStockMovements
);

router.get(
    "/sales-chart",
    authMiddleware,
    controller.salesChart
);

router.get(
    "/top-products",
    authMiddleware,
    controller.topSellingProducts
);


module.exports = router;