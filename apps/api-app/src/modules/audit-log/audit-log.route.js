const express = require("express");

const controller =
    require("./audit-log.controller");

const {
    authMiddleware,
} = require("../../middlewares/auth.middleware");

const {
    roleMiddleware,
} = require("../../middlewares/role.middleware");

const router = express.Router();

router.get(
    "/",

    authMiddleware,

    roleMiddleware(
        "OWNER",
        "ADMIN"
    ),

    controller.findAll
);

router.get(
    "/latest",
    authMiddleware,
    controller.findLatest
);

router.get(
    "/:id",

    authMiddleware,

    roleMiddleware(
        "OWNER"
    ),

    controller.findById
);



module.exports = router;