import { Server } from "socket.io";
import { verifyAccessToken } from "../services/token.service.js";

let io = null;

export const initializeNotificationGateway = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  io.use((socket, next) => {
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
      socket.data.user = { id: userId, role: payload.role };
      socket.data.tokenExpiresAt = Number(payload.exp) * 1000;
      return next();
    } catch {
      return next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    const { id, role } = socket.data.user;
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

export const publishNotification = (notification) => {
  if (!io) return;
  const room = notification.audience === "ADMIN"
    ? "admins"
    : `user:${notification.recipientUserId}`;
  io.to(room).emit("notification:new", notification);
};
