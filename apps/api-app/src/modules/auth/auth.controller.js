const service = require("./auth.service");

const {
  registerSchema,
  loginSchema,
} = require("./auth.validation");

exports.register = async (req, res) => {

  try {

    const validated =
      registerSchema.parse(req.body);

    const result =
      await service.register(validated);

    res.status(201).json({
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

exports.login = async (req, res) => {

  try {

    const validated =
      loginSchema.parse(req.body);

    const result =
      await service.login(validated);

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

    const result =
      await service.refreshToken(req.user);

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