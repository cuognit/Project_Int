import * as categoryService from "../services/category.service.js";

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const parseName = (body) => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 100) return null;
  return name;
};

const handleError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }
  return next(error);
};

export const listCategories = async (_req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: await categoryService.getCategories(),
    });
  } catch (error) {
    return next(error);
  }
};

export const createCategory = async (req, res, next) => {
  const name = parseName(req.body);
  if (!name) {
    return res.status(400).json({
      success: false,
      message: "Tên danh mục không được để trống và tối đa 100 ký tự",
    });
  }
  try {
    return res.status(201).json({
      success: true,
      data: await categoryService.createCategory(name),
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const updateCategory = async (req, res, next) => {
  const id = parseId(req.params.categoryId);
  const name = parseName(req.body);
  if (!id || !name) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu danh mục không hợp lệ",
    });
  }
  try {
    return res.status(200).json({
      success: true,
      data: await categoryService.updateCategory(id, name),
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const deleteCategory = async (req, res, next) => {
  const id = parseId(req.params.categoryId);
  if (!id) {
    return res.status(400).json({
      success: false,
      message: "ID danh mục không hợp lệ",
    });
  }
  try {
    return res.status(200).json({
      success: true,
      data: await categoryService.deleteCategory(id),
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};
