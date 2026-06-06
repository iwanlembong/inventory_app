const express = require("express");

const controller =
    require("./user.controller");

const {
    authMiddleware,
} = require(
    "../../middlewares/auth.middleware"
);

const {
    roleMiddleware,
} = require(
    "../../middlewares/role.middleware"
);

const {
    ROLES,
} = require(
    "../../constants/roles"
);

const router = express.Router();

/* ====================== */
/* CREATE USER */
/* ====================== */

router.post(
    "/",
    authMiddleware,
    roleMiddleware(
        ROLES.OWNER,
        ROLES.ADMIN
    ),
    controller.create
);

/* ====================== */
/* GET ALL USERS */
/* ====================== */

router.get(
    "/",
    authMiddleware,
    roleMiddleware(
        ROLES.OWNER,
        ROLES.ADMIN
    ),
    controller.findAll
);

/* ====================== */
/* GET USER DETAIL */
/* ====================== */

router.get(
    "/:id",
    authMiddleware,
    roleMiddleware(
        ROLES.OWNER,
        ROLES.ADMIN
    ),
    controller.findById
);

/* ====================== */
/* UPDATE USER */
/* ====================== */

router.put(
    "/:id",
    authMiddleware,
    roleMiddleware(
        ROLES.OWNER,
        ROLES.ADMIN
    ),
    controller.update
);

/* ====================== */
/* CHANGE PASSWORD */
/* ====================== */

router.patch(
    "/:id/password",
    authMiddleware,
    roleMiddleware(
        ROLES.OWNER,
        ROLES.ADMIN
    ),
    controller.changePassword
);

/* ====================== */
/* DELETE USER */
/* ====================== */

router.delete(
    "/:id",
    authMiddleware,
    roleMiddleware(
        ROLES.OWNER
    ),
    controller.remove
);

module.exports = router;