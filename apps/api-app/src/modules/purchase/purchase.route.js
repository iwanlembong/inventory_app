const express = require("express");

const controller =
  require("./purchase.controller");

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

module.exports = router;