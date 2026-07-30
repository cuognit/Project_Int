import * as orderService from "../services/order.service.js";
import {
  adminOrdersQuerySchema,
  createOrderSchema,
  myOrdersQuerySchema,
  orderIdSchema,
  updateOrderStatusSchema,
} from "../validators/order.validator.js";
import { formatValidationErrors } from "../validators/auth.validator.js";
import { publishAdminOrderQueueChanged } from "../socket/notification.gateway.js";

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

// Tạo đơn hàng từ giỏ hàng và thông tin giao nhận đã xác thực.
export const createOrder = async (req, res, next) => {
  const validation = createOrderSchema.safeParse(req.body);
  if (!validation.success) return validationError(res, validation.error.issues);
  try {
    const order = await orderService.createOrder(
      req.user.id,
      validation.data,
      req.ip || req.socket.remoteAddress,
    );
    publishAdminOrderQueueChanged({
      action: "created",
      orderId: order.id,
      status: order.status,
    });
    return res.status(201).json({ success: true, data: order });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Lấy danh sách đơn hàng phân trang dành cho quản trị viên.
export const listAdminOrders = async (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Chỉ quản trị viên được xem hàng đợi đơn hàng" });
  }
  const validation = adminOrdersQuerySchema.safeParse(req.query);
  if (!validation.success) return validationError(res, validation.error.issues);
  try {
    const data = await orderService.getAdminOrders(validation.data);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

// Thống kê số lượng đơn hàng theo trạng thái cho khu vực quản trị.
export const getAdminOrderCounts = async (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Chỉ quản trị viên được xem hàng đợi đơn hàng" });
  }
  try {
    const counts = await orderService.getAdminOrderCounts();
    return res.status(200).json({ success: true, data: { counts } });
  } catch (error) {
    return next(error);
  }
};

// Lấy danh sách đơn hàng theo phạm vi truy vấn được phép.
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

// Lấy lịch sử đơn hàng phân trang của người dùng hiện tại.
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

// Lấy chi tiết một đơn hàng theo quyền truy cập của người dùng.
export const getOrder = async (req, res, next) => {
  const orderId = orderIdSchema.safeParse(req.params.orderId);
  if (!orderId.success) return validationError(res, orderId.error.issues);
  try {
    const order = await orderService.getOrderById(orderId.data);
    if (!order) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }
    if (req.user.role !== "admin" && order.userId !== req.user.id) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đơn hàng" });
    }
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return next(error);
  }
};

// Cập nhật trạng thái đơn hàng theo quy tắc chuyển trạng thái.
export const updateStatus = async (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Chỉ quản trị viên được cập nhật đơn hàng" });
  }
  const orderId = orderIdSchema.safeParse(req.params.orderId);
  const body = updateOrderStatusSchema.safeParse(req.body);
  if (!orderId.success) return validationError(res, orderId.error.issues);
  if (!body.success) return validationError(res, body.error.issues);
  try {
    const order = await orderService.updateOrderStatus(
      orderId.data,
      body.data.status,
      `admin:${req.user.id}`,
      req.ip || req.socket.remoteAddress,
    );
    publishAdminOrderQueueChanged({
      action: "status-updated",
      orderId: order.id,
      status: order.status,
    });
    return res.status(200).json({ success: true, data: order });
  } catch (error) {
    return handleError(error, res, next);
  }
};

// Hủy đơn hàng của người dùng khi đơn vẫn đủ điều kiện hủy.
export const cancelOrder = async (req, res, next) => {
  const orderId = orderIdSchema.safeParse(req.params.orderId);
  if (!orderId.success) return validationError(res, orderId.error.issues);
  try {
    const order = await orderService.cancelOrder(
      req.user.id,
      orderId.data,
      req.ip || req.socket.remoteAddress,
    );
    publishAdminOrderQueueChanged({
      action: "status-updated",
      orderId: order.id,
      status: order.status,
    });
    return res.status(200).json({
      success: true,
      message: "Hủy đơn hàng thành công",
      data: order,
    });
  } catch (error) {
    return handleError(error, res, next);
  }
};
