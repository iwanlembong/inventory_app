const service = require("./category.service");

const {
  createCategorySchema,
  updateCategorySchema,
} = require("./category.validation");

exports.create = async (req, res) => {

  try {

    const validated =
      createCategorySchema.parse(req.body);

    const result = await service.create(
      validated,
      req.user.tenantId,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      message: "Category created successfully",
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
    res,
    next

) => {

    try {

        const result =
            await service.findAll(

                req.user.tenantId,

                req.query

            );

        res.json({

            success: true,

            data: result.data,

            meta: result.meta,

        });

    } catch (err) {

        next(err);

    }

};

exports.findById = async (req, res) => {

  try {

    const result = await service.findById(
      req.params.id,
      req.user.tenantId
    );

    res.json({
      success: true,
      data: result,
    });

  } catch (err) {

    res.status(404).json({
      success: false,
      message: err.message,
    });

  }

};

exports.update = async (req, res) => {

  try {

    const validated =
      updateCategorySchema.parse(req.body);

    const result = await service.update(
      req.params.id,
      validated,
      req.user.tenantId,
      req.user.userId
    );

    res.json({
      success: true,
      message: "Category updated successfully",
      data: result,
    });

  } catch (err) {

    res.status(400).json({
      success: false,
      message: err.message,
    });

  }

};

exports.remove = async (req, res) => {

  try {

    await service.remove(
      req.params.id,
      req.user.tenantId,
      req.user.userId
    );

    res.json({
      success: true,
      message: "Category deleted successfully",
    });

  } catch (err) {

    res.status(400).json({
      success: false,
      message: err.message,
    });

  }

};