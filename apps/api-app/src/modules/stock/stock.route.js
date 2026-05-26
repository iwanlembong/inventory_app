const express = require("express");

const controller =
  require("./stock.controller");

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

module.exports = router;