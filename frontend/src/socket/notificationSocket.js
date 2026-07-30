import { io } from "socket.io-client";
import { clearSession } from "../auth/sessionStore.js";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const socketUrl = import.meta.env.VITE_SOCKET_URL || apiUrl.replace(/\/api\/?$/, "");
let socket = null;

// Tạo kết nối thông báo realtime hoặc tái sử dụng kết nối hiện có.
export const connectNotificationSocket = (accessToken) => {
  if (!accessToken) return null;
  if (socket) socket.disconnect();
  socket = io(socketUrl, {
    auth: { token: accessToken },
    withCredentials: true,
    transports: ["websocket", "polling"],
  });
  socket.on("session:revoked", () => {
    clearSession();
    socket?.disconnect();
    socket = null;
  });
  return socket;
};

// Ngắt kết nối thông báo nếu đúng socket đang hoạt động.
export const disconnectNotificationSocket = (targetSocket) => {
  if (targetSocket) targetSocket.disconnect();
  if (!targetSocket || socket === targetSocket) socket = null;
};
