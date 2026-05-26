const express = require("express");

const {authMiddleware,} = require("../../middlewares/auth.middleware");
const controller = require("./auth.controller");

const router = express.Router();

router.post("/register", controller.register);

router.post("/login", controller.login);

router.get("/me", authMiddleware, controller.me);

router.post("/refresh-token", authMiddleware, controller.refreshToken);

module.exports = router;