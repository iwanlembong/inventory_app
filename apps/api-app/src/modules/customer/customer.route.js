const express =
    require("express");


const controller =
    require("./customer.controller");

const {
    authMiddleware,
} = require("../../middlewares/auth.middleware");

/* ====================== */
/* CUSTOMER */
/* ====================== */

const router = express.Router();

/* CREATE */
router.post(
    "/",
    authMiddleware,
    controller.create
);

/* FIND ALL */
router.get(
    "/",
    authMiddleware,
    controller.findAll
);

/* FIND BY ID */
router.get(
    "/:id",
    authMiddleware,
    controller.findById
);

/* UPDATE */
router.put(
    "/:id",
    authMiddleware,
    controller.update
);

/* DELETE */
router.delete(
    "/:id",
    authMiddleware,
    controller.remove
);

module.exports =
    router;