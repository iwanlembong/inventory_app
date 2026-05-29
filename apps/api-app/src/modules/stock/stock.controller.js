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

    res.status(201).json({
      success: true,
      data: result,
    });

  } catch (err) {
    const errorMap = {
      "Product not found": 404,
      "Insufficient stock": 400,
    };

    const status =
      errorMap[err.message] || 500;
    res.status(status).json({
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

    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const search = req.query.search || "";
    const type = req.query.type || "";

    const result =
      await service.findAll(
        req.user.tenantId,
        {
          page,
          limit,
          search,
          type,
        }
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

exports.getByProductId = async (req, res, next) => {
  try {
    console.log("REQ PARAM:", req.params);
    console.log("USER:", req.user);

    const tenantId = req.user.tenantId;
    const productId = Number(req.params.productId);

    const data = await service.findByProductId(
      tenantId,
      productId
    );

    res.json({
      success: true,
      data,
    });
  } catch (err) {
     console.error("STOCK HISTORY ERROR:", err);
    next(err);
  }
};