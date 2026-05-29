const express = require("express");

const controller =
  require("./stock.controller");

const {
  authMiddleware,
} = require("../../middlewares/auth.middleware");
const { roleMiddleware } = require("../../middlewares/role.middleware");
const { ROLES } = require("../../constants/roles");
const router = express.Router();

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

router.get(
  "/",
  authMiddleware,
  controller.findAll
);

router.get("/:productId", authMiddleware, controller.getByProductId);


module.exports = router;