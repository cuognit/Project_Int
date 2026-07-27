import * as orderService from "../services/order.service.js";
import {
  createOrderSchema,
  myOrdersQuerySchema,
  orderIdSchema,
  updateOrderStatusSchema,
} from "../validators/order.validator.js";
import { formatValidationErrors } from "../validators/auth.validator.js";

const validationError = (res, issues) => res.status(400).json({
  success: false,
  message: "Dữ liệu đơn hàng không hợp lệ",
  errors: formatValidationErrors(issues),
});

const handleError = (error, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }
  return next(error);
};

export const createOrder = async (req, res, next) => {
  const validation = createOrderSchema.safeParse(req.body);
  if (!validation.success) return validationError(res, validation.error.issues);
  try {
    const order = await orderService.createOrder(req.user.id, validation.data);
    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const listOrders = async (req, res, next) => {
  try {
    const requestedUserId = Number(req.query.userId);
    const userId = req.user.role === "admin"
      ? (Number.isInteger(requestedUserId) && requestedUserId > 0 ? requestedUserId : undefined)
      : req.user.id;
    const orders = await orderService.getOrders({ userId });
    return res.status(200).json({ success: true, data: orders });
  } catch (error) {
    return next(error);
  }
};

export const listMyOrders = async (req, res, next) => {
  const validation = myOrdersQuerySchema.safeParse(req.query);
  if (!validation.success) return validationError(res, validation.error.issues);
  try {
    const data = await orderService.getMyOrders(req.user.id, validation.data);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const getOrder = async (req, res, next) => {
  const orderId = orderIdSchema.safeParse(req.params.orderId);
  if (!orderId.success) return validationError(res, orderId.error.issues);
  try {
    const order = await orderService.getOrderById(orderId.data);
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }
    if (req.user.role !== "admin" && order.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem đơn hàng này" });
    }
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return next(error);
  }
};

export const updateStatus = async (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Chỉ quản trị viên được cập nhật đơn hàng" });
  }
  const orderId = orderIdSchema.safeParse(req.params.orderId);
  const body = updateOrderStatusSchema.safeParse(req.body);
  if (!orderId.success) return validationError(res, orderId.error.issues);
  if (!body.success) return validationError(res, body.error.issues);
  try {
    const order = await orderService.updateOrderStatus(orderId.data, body.data.status);
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return handleError(error, res, next);
  }
};

export const cancelOrder = async (req, res, next) => {
  const orderId = orderIdSchema.safeParse(req.params.orderId);
  if (!orderId.success) return validationError(res, orderId.error.issues);
  try {
    const order = await orderService.cancelOrder(req.user.id, orderId.data);
    return res.status(200).json({
      success: true,
      message: "Hủy đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};
