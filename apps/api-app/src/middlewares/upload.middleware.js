const multer = require("multer");

const storage = multer.diskStorage({

  destination: (req, file, cb) => {
    cb(null, "uploads/products");
  },

  filename: (req, file, cb) => {

    const unique =
      Date.now() + "-" + file.originalname;

    cb(null, unique);

  },

});

exports.upload =
  multer({ storage });