import { useCallback, useEffect, useRef, useState } from "react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
} from "../api/notificationApi.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  connectNotificationSocket,
  disconnectNotificationSocket,
} from "../socket/notificationSocket.js";
import { emitAdminOrderQueueChanged } from "../utils/adminOrderQueueEvents.js";

// Quản lý danh sách, số chưa đọc và kết nối thông báo realtime.
export default function useNotifications() {
  const {
    user,
    accessToken,
    isAuthenticated,
    isAuthInitializing,
  } = useAuth();
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [latestNotification, setLatestNotification] = useState(null);
  const generationRef = useRef(0);
  const receivedIdsRef = useRef(new Set());

  useEffect(() => {
    const generation = ++generationRef.current;
    receivedIdsRef.current.clear();
    setItems([]);
    setUnreadCount(0);
    setError("");
    if (isAuthInitializing || !isAuthenticated) return;
    getUnreadNotificationCount()
      .then((data) => {
        if (generation === generationRef.current) {
          setUnreadCount(data.unreadCount || 0);
        }
      })
      .catch(() => {});
  }, [user?.id, user?.role, isAuthenticated, isAuthInitializing]);

  useEffect(() => {
    if (isAuthInitializing || !isAuthenticated || !accessToken) return undefined;
    const activeSocket = connectNotificationSocket(accessToken);
    const handleNotification = (notification) => {
      if (receivedIdsRef.current.has(notification.id)) return;
      receivedIdsRef.current.add(notification.id);
      setItems((current) => [notification, ...current].slice(0, 10));
      if (!notification.readAt) {
        setUnreadCount((count) => count + 1);
        setLatestNotification(notification);
      }
      if (
        user?.role === "admin"
        && ["NEW_ORDER", "ORDER_CANCELLED"].includes(notification.type)
      ) {
        emitAdminOrderQueueChanged({
          action: notification.type,
          orderId: notification.orderId,
        });
      }
    };
    const handleOrderQueueChanged = (payload) => {
      if (user?.role === "admin") emitAdminOrderQueueChanged(payload);
    };
    const handleConnect = () => {
      setError("");
      if (user?.role === "admin") {
        emitAdminOrderQueueChanged({ action: "socket-reconnected" });
      }
    };
    const handleConnectError = () => {
      setError("Mất kết nối thông báo realtime. Hệ thống đang thử kết nối lại.");
    };
    activeSocket.on("notification:new", handleNotification);
    activeSocket.on("admin:order-queue-changed", handleOrderQueueChanged);
    activeSocket.on("connect", handleConnect);
    activeSocket.on("connect_error", handleConnectError);
    return () => {
      activeSocket.off("notification:new", handleNotification);
      activeSocket.off("admin:order-queue-changed", handleOrderQueueChanged);
      activeSocket.off("connect", handleConnect);
      activeSocket.off("connect_error", handleConnectError);
      disconnectNotificationSocket(activeSocket);
    };
  }, [accessToken, isAuthenticated, isAuthInitializing, user?.role]);

  // Tải danh sách thông báo mới nhất khi người dùng mở bảng thông báo.
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    const generation = generationRef.current;
    setLoading(true);
    setError("");
    try {
      const data = await getNotifications(10);
      if (generation !== generationRef.current) return;
      receivedIdsRef.current = new Set(
        (data.items || []).map((item) => item.id),
      );
      setItems(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (err) {
      if (generation === generationRef.current) {
        setError(err?.message || "Không thể tải thông báo.");
      }
    } finally {
      if (generation === generationRef.current) setLoading(false);
    }
  }, [isAuthenticated]);

  // Cập nhật trạng thái đã đọc ở cả giao diện và backend.
  const markAsRead = useCallback(async (notification) => {
    if (notification.readAt) return notification;
    const readAt = new Date().toISOString();
    setItems((current) => current.map((item) =>
      item.id === notification.id ? { ...item, readAt } : item
    ));
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      const updated = await markNotificationRead(notification.id);
      setItems((current) => current.map((item) =>
        item.id === updated.id ? updated : item
      ));
      return updated;
    } catch (err) {
      setItems((current) => current.map((item) =>
        item.id === notification.id ? notification : item
      ));
      setUnreadCount((count) => count + 1);
      throw err;
    }
  }, []);

  const clearLatestNotification = useCallback(
    () => setLatestNotification(null),
    [],
  );

  return {
    items,
    unreadCount,
    loading,
    error,
    loadNotifications,
    markAsRead,
    latestNotification,
    clearLatestNotification,
  };
}
