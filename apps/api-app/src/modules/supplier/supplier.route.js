const express = require("express");

const controller =
  require("./supplier.controller");

const {
  authMiddleware,
} = require("../../middlewares/auth.middleware");

const router = express.Router();

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

router.get(
  "/:id",
  authMiddleware,
  controller.findById
);

router.put(
  "/:id",
  authMiddleware,
  controller.update
);

router.delete(
  "/:id",
  authMiddleware,
  controller.remove
);

module.exports = router;