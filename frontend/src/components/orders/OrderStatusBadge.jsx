const styles = {
  PENDING: "bg-amber-50 text-amber-700 border border-amber-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border border-blue-200",
  SHIPPING: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  CANCELLED: "bg-rose-50 text-rose-700 border border-rose-200",
};

const labels = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  SHIPPING: "Đang giao hàng",
  COMPLETED: "Đã hoàn thành",
  CANCELLED: "Đã hủy",
};

export default function OrderStatusBadge({ status }) {
  const normStatus = String(status).toUpperCase();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${styles[normStatus] || "bg-slate-50 text-slate-700 border border-slate-200"}`}
    >
      {labels[normStatus] || status}
    </span>
  );
}
