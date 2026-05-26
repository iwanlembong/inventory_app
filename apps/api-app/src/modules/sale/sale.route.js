const express = require("express");

const controller =
  require("./sale.controller");

const {
  authMiddleware,
} = require("../../middlewares/auth.middleware");

const {
  roleMiddleware,
} = require(
  "../../middlewares/role.middleware"
);

const router = express.Router();

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

router.get(
  "/",
  authMiddleware,
  controller.findAll
);

router.get(
  "/:id",
  authMiddleware,
  controller.findById
);

module.exports = router;