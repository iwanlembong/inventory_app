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
const { ROLES } = require("../../constants/roles");

const router =
  express.Router();

/* ====================== */
/* CREATE */
/* ====================== */

router.post(
  "/",
  authMiddleware,
  roleMiddleware(
    ROLES.OWNER,
    ROLES.ADMIN
  ),
  upload.array("images", 5),
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
  roleMiddleware(
    ROLES.OWNER,
    ROLES.ADMIN
  ),
  upload.array("images", 5),
  controller.update
);

/* ====================== */
/* DELETE */
/* ====================== */

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(
    ROLES.OWNER,
    ROLES.ADMIN
  ),
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

/* ====================== */
/* DELETE SINGLE IMAGE */
/* ====================== */

router.delete(

  "/image/:imageId",

  authMiddleware,

  controller.deleteImage

);

router.patch(
  "/images/:imageId/thumbnail",
  authMiddleware,
  controller.setThumbnail
);

module.exports = router;