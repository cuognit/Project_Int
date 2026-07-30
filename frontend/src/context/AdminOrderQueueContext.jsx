import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getAdminOrderCounts } from "../api/orderApi.js";
import { ADMIN_ORDER_QUEUE_EVENT } from "../utils/adminOrderQueueEvents.js";

const AdminOrderQueueContext = createContext(null);

// Theo dõi realtime số đơn chờ xử lý cho toàn bộ khu vực quản trị.
export function AdminOrderQueueProvider({ children }) {
  const [pendingCount, setPendingCount] = useState(0);
  const [queueVersion, setQueueVersion] = useState(0);
  const refreshTimerRef = useRef(null);

  // Đồng bộ lại số đơn đang chờ từ backend.
  const refreshPendingCount = useCallback(async () => {
    try {
      const data = await getAdminOrderCounts();
      setPendingCount(Number(data.counts?.PENDING || 0));
    } catch {
      // Keep the last known count; the page has its own visible error state.
    }
  }, []);

  useEffect(() => {
    refreshPendingCount();

    const reconcile = () => refreshPendingCount();
    const handleQueueChanged = () => {
      window.clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = window.setTimeout(() => {
        setQueueVersion((version) => version + 1);
        refreshPendingCount();
      }, 200);
    };

    window.addEventListener("focus", reconcile);
    window.addEventListener(ADMIN_ORDER_QUEUE_EVENT, handleQueueChanged);
    return () => {
      window.clearTimeout(refreshTimerRef.current);
      window.removeEventListener("focus", reconcile);
      window.removeEventListener(ADMIN_ORDER_QUEUE_EVENT, handleQueueChanged);
    };
  }, [refreshPendingCount]);

  const value = {
    pendingCount,
    queueVersion,
    refreshPendingCount,
    setPendingCount,
  };

  return (
    <AdminOrderQueueContext.Provider value={value}>
      {children}
    </AdminOrderQueueContext.Provider>
  );
}

// Truy cập trạng thái hàng đợi đơn hàng trong AdminOrderQueueProvider.
export const useAdminOrderQueue = () => {
  const context = useContext(AdminOrderQueueContext);
  if (!context) {
    throw new Error("useAdminOrderQueue must be used inside AdminOrderQueueProvider");
  }
  return context;
};
