import * as cartService from "../services/cart.service.js";
import {
  addCartItemSchema,
  productIdSchema,
  updateCartItemSchema,
} from "../validators/cart.validator.js";
import { formatValidationErrors } from "../validators/auth.validator.js";

const handleError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }
  return next(error);
};

const invalidPayload = (res, validation) =>
  res.status(400).json({
    success: false,
    message: "Dữ liệu giỏ hàng không hợp lệ",
    errors: formatValidationErrors(validation.error.issues),
  });

// Lấy giỏ hàng hiện tại của người dùng đã đăng nhập.
export const getCart = async (req, res, next) => {
  try {
    return res.status(200).json({
      success: true,
      data: await cartService.getCart(req.user.id),
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Thêm sản phẩm hoặc tăng số lượng sản phẩm trong giỏ hàng.
export const addItem = async (req, res, next) => {
  const validation = addCartItemSchema.safeParse(req.body);
  if (!validation.success) return invalidPayload(res, validation);
  try {
    return res.status(200).json({
      success: true,
      data: await cartService.addItem(req.user.id, validation.data),
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Cập nhật số lượng của một sản phẩm trong giỏ hàng.
export const updateItem = async (req, res, next) => {
  const productId = productIdSchema.safeParse(req.params.productId);
  const body = updateCartItemSchema.safeParse(req.body);
  if (!productId.success) return invalidPayload(res, productId);
  if (!body.success) return invalidPayload(res, body);
  try {
    return res.status(200).json({
      success: true,
      data: await cartService.updateItem(
        req.user.id,
        productId.data,
        body.data.quantity,
      ),
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Xóa một sản phẩm khỏi giỏ hàng.
export const removeItem = async (req, res, next) => {
  const productId = productIdSchema.safeParse(req.params.productId);
  if (!productId.success) return invalidPayload(res, productId);
  try {
    return res.status(200).json({
      success: true,
      data: await cartService.removeItem(req.user.id, productId.data),
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};
