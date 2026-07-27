import axiosClient from "./axiosClient.js";

const unwrap = (request) => request.then((response) => response.data.data);

export const getUnreadNotificationCount = () =>
  unwrap(axiosClient.get("/notifications/unread-count"));
export const getNotifications = (limit = 10) =>
  unwrap(axiosClient.get("/notifications", { params: { limit } }));
export const markNotificationRead = (notificationId) =>
  unwrap(axiosClient.patch(`/notifications/${notificationId}/read`));
