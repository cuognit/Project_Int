export const ADMIN_ORDER_QUEUE_EVENT = "admin-order-queue:changed";

// Phát sự kiện cục bộ khi danh sách đơn chờ xử lý thay đổi.
export const emitAdminOrderQueueChanged = (detail = {}) => {
  window.dispatchEvent(new CustomEvent(ADMIN_ORDER_QUEUE_EVENT, { detail }));
};
