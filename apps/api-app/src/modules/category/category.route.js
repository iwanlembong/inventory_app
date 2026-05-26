const express = require("express");

const controller = require("./category.controller");

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
  roleMiddleware("OWNER"),
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

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware("OWNER", "ADMIN"),
  controller.update
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("OWNER"),
  controller.remove
);

module.exports = router;