import { Server } from "socket.io";
import { verifyAccessToken } from "../services/token.service.js";
import { User } from "../models/index.js";

let io = null;

// Khởi tạo Socket.IO, xác thực kết nối và quản lý phòng người dùng.
export const initializeNotificationGateway = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const payload = verifyAccessToken(token);
      const userId = Number(payload.sub);
      if (
        payload.type !== "access" ||
        !Number.isInteger(userId) ||
        userId <= 0
      ) {
        throw new Error("Invalid access token");
      }
      const user = await User.findByPk(userId, {
        attributes: ["id", "role", "isActive"],
      });
      if (!user?.isActive) throw new Error("Inactive account");
      socket.data.user = { id: user.id, role: user.role };
      socket.data.tokenExpiresAt = Number(payload.exp) * 1000;
      return next();
    } catch {
      return next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    const { id, role } = socket.data.user;
    socket.join(`account:${id}`);
    if (role === "admin") socket.join("admins");
    else socket.join(`user:${id}`);

    const remainingLifetime = socket.data.tokenExpiresAt - Date.now();
    if (remainingLifetime <= 0) {
      socket.disconnect(true);
      return;
    }
    const expiryTimer = setTimeout(
      () => socket.disconnect(true),
      remainingLifetime,
    );
    socket.on("disconnect", () => clearTimeout(expiryTimer));
  });

  return io;
};

// Phát thông báo realtime tới đúng người dùng hoặc nhóm quản trị.
export const publishNotification = (notification) => {
  if (!io) return;
  const room = notification.audience === "ADMIN"
    ? "admins"
    : `user:${notification.recipientUserId}`;
  io.to(room).emit("notification:new", notification);
};

// Báo cho quản trị viên khi hàng đợi đơn chờ xử lý thay đổi.
export const publishAdminOrderQueueChanged = (payload) => {
  if (!io) return;
  io.to("admins").emit("admin:order-queue-changed", payload);
};

// Ngắt toàn bộ kết nối realtime của người dùng bị thu hồi quyền.
export const disconnectUserSessions = (userId) => {
  if (!io) return;
  const room = `account:${userId}`;
  io.to(room).emit("session:revoked");
  io.in(room).disconnectSockets(true);
};
