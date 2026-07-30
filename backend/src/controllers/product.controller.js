import * as productService from "../services/product.service.js";
import { Category } from "../models/index.js";

const parseId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
};

const validatePayload = (body) => {
  const errors = {};
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const sku = typeof body.sku === "string" ? body.sku.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const imageUrl = typeof body.imageUrl === "string" ? body.imageUrl.trim() : "";
  const price = Number(body.price);
  const stock = Number(body.stock);
  const categoryId = Number(body.categoryId);

  if (!name) errors.name = "Tên sản phẩm không được để trống";
  else if (name.length > 150) errors.name = "Tên sản phẩm tối đa 150 ký tự";
  if (!sku) errors.sku = "SKU không được để trống";
  else if (sku.length > 50) errors.sku = "SKU tối đa 50 ký tự";

  if (body.price === "" || body.price == null) errors.price = "Giá bán không được để trống";
  else if (!Number.isFinite(price) || price < 0) errors.price = "Giá bán phải là số không âm";
  if (body.stock === "" || body.stock == null) errors.stock = "Tồn kho không được để trống";
  else if (!Number.isInteger(stock) || stock < 0) errors.stock = "Tồn kho phải là số nguyên không âm";

  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      if (!["http:", "https:"].includes(url.protocol)) {
        errors.imageUrl = "URL ảnh phải dùng giao thức http hoặc https";
      }
    } catch {
      errors.imageUrl = "URL ảnh không hợp lệ";
    }
  }
  if (body.isActive !== undefined && typeof body.isActive !== "boolean") {
    errors.isActive = "Trạng thái sản phẩm không hợp lệ";
  }
  if (!Number.isInteger(categoryId) || categoryId <= 0) {
    errors.categoryId = "Vui lòng chọn danh mục";
  }

  return {
    errors,
    value: {
      name, sku, description: description || null, price, stock,
      imageUrl: imageUrl || null, isActive: body.isActive ?? true, categoryId,
    },
  };
};

const invalidId = (res) =>
  res.status(400).json({ success: false, message: "ID sản phẩm không hợp lệ" });
const notFound = (res) =>
  res.status(404).json({ success: false, message: "Không tìm thấy sản phẩm" });

// Lấy danh sách sản phẩm đang hiển thị cho khách hàng.
export const listProducts = async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, data: await productService.getProducts(req.query) });
  } catch (error) { return next(error); }
};

// Lấy danh sách sản phẩm đầy đủ cho quản trị viên.
export const listAdminProducts = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: await productService.getProducts(req.query, { admin: true }),
    });
  } catch (error) {
    return next(error);
  }
};

// Lấy chi tiết một sản phẩm theo mã định danh.
export const getProduct = async (req, res, next) => {
  try {
    const id = parseId(req.params.productId);
    if (!id) return invalidId(res);
    const product = await productService.getProductById(id);
    if (!product) return notFound(res);
    return res.status(200).json({ success: true, data: product });
  } catch (error) { return next(error); }
};

const saveProduct = async (req, res, next, product) => {
  try {
    const { errors, value } = validatePayload(req.body);
    if (Object.keys(errors).length) {
      return res.status(400).json({
        success: false, message: "Dữ liệu sản phẩm không hợp lệ", errors,
      });
    }
    if (!(await Category.findByPk(value.categoryId))) {
      return res.status(400).json({
        success: false,
        message: "Danh mục không tồn tại",
        errors: { categoryId: "Danh mục không tồn tại" },
      });
    }
    if (await productService.findProductBySku(value.sku, product?.id)) {
      return res.status(409).json({
        success: false, message: "SKU đã tồn tại", errors: { sku: "SKU đã tồn tại" },
      });
    }
    const saved = product
      ? await productService.updateProduct(product, value)
      : await productService.createProduct(value);
    return res.status(product ? 200 : 201).json({ success: true, data: saved });
  } catch (error) { return next(error); }
};

// Tạo sản phẩm mới từ dữ liệu đã gửi lên.
export const createProduct = (req, res, next) => saveProduct(req, res, next);

// Cập nhật sản phẩm hiện có sau khi kiểm tra mã định danh.
export const updateProduct = async (req, res, next) => {
  try {
    const id = parseId(req.params.productId);
    if (!id) return invalidId(res);
    const product = await productService.getProductById(id, { admin: true });
    if (!product) return notFound(res);
    return saveProduct(req, res, next, product);
  } catch (error) { return next(error); }
};

// Xóa sản phẩm khi không bị ràng buộc bởi dữ liệu liên quan.
export const deleteProduct = async (req, res, next) => {
  try {
    const id = parseId(req.params.productId);
    if (!id) return invalidId(res);
    const product = await productService.getProductById(id, { admin: true });
    if (!product) return notFound(res);
    return res.status(200).json({
      success: true, data: await productService.deleteProduct(product),
    });
  } catch (error) { return next(error); }
};
