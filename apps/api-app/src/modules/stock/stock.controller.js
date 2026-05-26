const service = require("./stock.service");

const {
  stockSchema,
} = require("./stock.validation");

exports.create = async (
  req,
  res
) => {

  try {

    const validated =
      stockSchema.parse(req.body);

    const result =
      await service.create(
        validated,
        req.user.tenantId,
        req.user.userId
      );

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

exports.findAll = async (
  req,
  res
) => {

  try {

    const result =
      await service.findAll(
        req.user.tenantId
      );

    res.json({
      success: true,
      data: result,
    });

  } catch (err) {

    res.status(500).json({
      success: false,
      message: err.message,
    });

  }

};