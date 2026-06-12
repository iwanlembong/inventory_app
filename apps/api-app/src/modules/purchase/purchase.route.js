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
    "/search",
    authMiddleware,
    controller.search
);

/* ====================================== */
/* PURCHASE DEATIL RETURN                 */
/* ====================================== */
router.get(
    "/:id/return",
    authMiddleware,
    controller.getDetailForReturn
);

router.get(
  "/:id",
  authMiddleware,
  controller.findById
);

router.get(
    "/:id/pdf",
    authMiddleware,
    controller.downloadPdf
);

router.patch(
    "/:id/cancel",
    authMiddleware,
    controller.cancel
);

module.exports = router;