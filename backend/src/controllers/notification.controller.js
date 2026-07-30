import * as notificationService from "../services/notification.service.js";
import {
  notificationIdSchema,
  notificationListQuerySchema,
} from "../validators/notification.validator.js";
import { formatValidationErrors } from "../validators/auth.validator.js";

const validationError = (res, issues) => res.status(400).json({
  success: false,
  message: "Dữ liệu thông báo không hợp lệ",
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

// Trả về số thông báo chưa đọc của người dùng hiện tại.
export const unreadCount = async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user);
    return res.status(200).json({
      success: true,
      data: { unreadCount: count },
    });
  } catch (error) {
    return next(error);
  }
};

// Lấy danh sách thông báo thuộc phạm vi truy cập của người dùng.
export const listNotifications = async (req, res, next) => {
  const validation = notificationListQuerySchema.safeParse(req.query);
  if (!validation.success) return validationError(res, validation.error.issues);
  try {
    const data = await notificationService.getNotifications(
      req.user,
      validation.data.limit,
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

// Đánh dấu một thông báo của người dùng là đã đọc.
export const markNotificationRead = async (req, res, next) => {
  const validation = notificationIdSchema.safeParse(req.params.notificationId);
  if (!validation.success) return validationError(res, validation.error.issues);
  try {
    const data = await notificationService.markAsRead(
      req.user,
      validation.data,
    );
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return handleError(error, res, next);
  }
};
