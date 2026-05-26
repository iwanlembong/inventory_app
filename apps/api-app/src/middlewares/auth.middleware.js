const jwt = require("jsonwebtoken");

exports.authMiddleware = (req, res, next) => {

  try {

    const bearerToken = req.headers.authorization;

    if (!bearerToken) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const token = bearerToken.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = decoded;

    next();

  } catch (err) {

    return res.status(401).json({
      message: "Unauthorized",
    });

  }

};