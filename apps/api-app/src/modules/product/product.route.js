const express = require("express");

const controller =
  require("./product.controller");

const {
  authMiddleware,
} = require(
  "../../middlewares/auth.middleware"
);

const {
  upload,
} = require(
  "../../middlewares/upload.middleware"
);

const {
  roleMiddleware,
} = require(
  "../../middlewares/role.middleware"
);

const router =
  express.Router();

/* ====================== */
/* CREATE */
/* ====================== */

router.post(
  "/",
  authMiddleware,
  roleMiddleware(
    "OWNER",
    "ADMIN"
  ),
  controller.create
);

/* ====================== */
/* GET ALL */
/* ====================== */

router.get(
  "/",
  authMiddleware,
  controller.findAll
);

/* ====================== */
/* GET BY ID */
/* ====================== */

router.get(
  "/:id",
  authMiddleware,
  controller.findById
);

/* ====================== */
/* UPDATE */
/* ====================== */

router.put(
  "/:id",
  authMiddleware,
  controller.update
);

/* ====================== */
/* DELETE */
/* ====================== */

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware("OWNER"),
  controller.remove
);

/* ====================== */
/* MULTIPLE IMAGES */
/* ====================== */

router.post(
  "/upload-images/:id",
  authMiddleware,
  upload.array("images", 5),
  controller.uploadImages
);

module.exports = router;