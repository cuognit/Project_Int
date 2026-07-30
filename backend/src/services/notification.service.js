import { Notification } from "../models/index.js";
import { publishNotification } from "../socket/notification.gateway.js";

const serviceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const scopeFor = (user) =>
  user.role === "admin"
    ? { audience: "ADMIN" }
    : { audience: "USER", recipientUserId: user.id };

// Chuyển thông báo từ model sang cấu trúc an toàn cho API.
export const serializeNotification = (notification) => ({
  id: notification.id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  metadata: notification.metadata,
  orderId: notification.orderId,
  readAt: notification.readAt,
  createdAt: notification.createdAt,
});

// Tạo nhiều thông báo và phát sự kiện realtime sau khi lưu thành công.
export const createNotifications = async (payloads, { transaction } = {}) => {
  const notifications = await Notification.bulkCreate(payloads, {
    transaction,
    returning: true,
  });
  const publish = () => {
    notifications.forEach((notification) => {
      publishNotification({
        ...serializeNotification(notification),
        audience: notification.audience,
        recipientUserId: notification.recipientUserId,
      });
    });
  };
  if (transaction) transaction.afterCommit(publish);
  else publish();
  return notifications;
};

// Đếm thông báo chưa đọc trong phạm vi của người dùng.
export const getUnreadCount = (user) =>
  Notification.count({
    where: { ...scopeFor(user), readAt: null },
  });

// Lấy các thông báo mới nhất trong phạm vi được phép.
export const getNotifications = async (user, limit) => {
  const scope = scopeFor(user);
  const [items, unreadCount] = await Promise.all([
    Notification.findAll({
      where: scope,
      order: [["createdAt", "DESC"]],
      limit,
    }),
    Notification.count({ where: { ...scope, readAt: null } }),
  ]);
  return {
    items: items.map(serializeNotification),
    unreadCount,
  };
};

// Đánh dấu thông báo thuộc quyền truy cập của người dùng là đã đọc.
export const markAsRead = async (user, notificationId) => {
  const notification = await Notification.findOne({
    where: { id: notificationId, ...scopeFor(user) },
  });
  if (!notification) throw serviceError(404, "Không tìm thấy thông báo");

  if (!notification.readAt) {
    await notification.update({
      readAt: new Date(),
      readByUserId: user.id,
    });
  }
  return serializeNotification(notification);
};
