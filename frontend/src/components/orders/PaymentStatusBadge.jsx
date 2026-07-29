const labels = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  FAILED: "Thanh toán thất bại",
  REFUNDING: "Đang hoàn tiền",
  REFUNDED: "Đã hoàn tiền",
  REFUND_FAILED: "Hoàn tiền lỗi",
  CANCELLED: "Đã hủy thanh toán",
};

const tones = {
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  PAID: "border-emerald-200 bg-emerald-50 text-emerald-700",
  FAILED: "border-rose-200 bg-rose-50 text-rose-700",
  REFUNDING: "border-blue-200 bg-blue-50 text-blue-700",
  REFUNDED: "border-slate-200 bg-slate-50 text-slate-600",
  REFUND_FAILED: "border-rose-200 bg-rose-50 text-rose-700",
  CANCELLED: "border-slate-200 bg-slate-50 text-slate-600",
};

export default function PaymentStatusBadge({ status }) {
  const normalized = String(status || "PENDING").toUpperCase();
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold ${tones[normalized] || tones.PENDING}`}>
      {labels[normalized] || normalized}
    </span>
  );
}
