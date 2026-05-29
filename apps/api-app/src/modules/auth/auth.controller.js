const service = require("./auth.service");

const {
  registerSchema,
  loginSchema,
} = require("./auth.validation");

exports.register = async (req, res) => {

  try {

    const validated =
      registerSchema.parse(
        req.body
      );

    const result =
      await service.register(
        validated
      );

    // 🔐 SET REFRESH TOKEN COOKIE
    res.cookie("refreshToken", result.refreshToken,
      {
        httpOnly: true,
        secure: false, // true kalau production HTTPS
        sameSite: "lax",
        path: "/",
        maxAge:
          7 * 24 * 60 * 60 * 1000,
      }
    );

    return res.status(201).json({

      success: true,

      data: {
        user:
          result.user,
        accessToken:
          result.accessToken,
      },

    });

  } catch (err) {

    return res.status(400).json({

      success: false,

      message: err.message,

    });

  }

};

exports.login = async (req, res) => {

  try {

    const result =
      await service.login(
        req.body
      );

    // 🔐 SET COOKIE
    res.cookie("refreshToken", result.refreshToken,
      {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      }
    );

    res.json({
      success: true,
      data: {

        user: result.user,
        accessToken: result.accessToken,
      },

    });

  } catch (err) {

    res.status(400).json({
      success: false,
      message: err.message,
    });

  }

};

exports.me = async (req, res) => {

  try {

    const result =
      await service.me(req.user.userId);

    res.json({
      success: true,
      data: result,
    });

  } catch (err) {

    res.status(400).json({
      success: false,
      message: err.message,
    });

  }

};

exports.refreshToken = async (req, res) => {

  try {
    const refreshToken = req.cookies.refreshToken;

    const result =
      await service.refreshToken(refreshToken);

    res.json({
      success: true,
      data: result,
    });

  } catch (err) {

    res.status(400).json({
      success: false,
      message: err.message,
    });

  }

};