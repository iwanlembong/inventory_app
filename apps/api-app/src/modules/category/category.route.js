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
const { ROLES } = require("../../constants/roles");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  roleMiddleware(
    ROLES.OWNER,
    ROLES.ADMIN
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

router.put(
  "/:id",
  authMiddleware,
  roleMiddleware(
    ROLES.OWNER,
    ROLES.ADMIN
  ),
  controller.update
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(
    ROLES.OWNER,
    ROLES.ADMIN
  ),
  controller.remove
);

module.exports = router;