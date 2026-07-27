import { io } from "socket.io-client";

const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const socketUrl = import.meta.env.VITE_SOCKET_URL || apiUrl.replace(/\/api\/?$/, "");
let socket = null;

export const connectNotificationSocket = (accessToken) => {
  if (!accessToken) return null;
  if (socket) socket.disconnect();
  socket = io(socketUrl, {
    auth: { token: accessToken },
    withCredentials: true,
    transports: ["websocket", "polling"],
  });
  return socket;
};

export const disconnectNotificationSocket = (targetSocket) => {
  if (targetSocket) targetSocket.disconnect();
  if (!targetSocket || socket === targetSocket) socket = null;
};
