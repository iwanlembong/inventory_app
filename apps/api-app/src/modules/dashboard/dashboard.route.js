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

const router = express.Router();

router.get(
  "/summary",
  authMiddleware,
  roleMiddleware(
    "OWNER",
    "ADMIN",
    "CASHIER"
  ),
  controller.summary
);

module.exports = router;