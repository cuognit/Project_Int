export default function CancelOrderModal({
  open,
  orderCode,
  loading,
  error,
  onClose,
  onConfirm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        onClick={loading ? undefined : onClose}
        aria-label="Đóng"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-order-title"
        className="relative w-full max-w-md rounded-3xl border border-white/50 bg-white p-6 shadow-2xl"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-6 w-6">
            <path strokeLinecap="round" d="M12 9v4m0 4h.01M10.3 4.2 2.8 17.3A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.7L13.7 4.2a2 2 0 0 0-3.4 0Z" />
          </svg>
        </div>
        <h2 id="cancel-order-title" className="mt-4 text-lg font-black text-slate-800">
          Xác nhận hủy đơn hàng?
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Đơn hàng <strong className="text-slate-700">#{orderCode}</strong> sẽ bị hủy và không thể hoàn tác. Sản phẩm sẽ không tự động được đưa lại vào giỏ hàng.
        </p>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Giữ đơn hàng
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex min-w-28 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
            {loading ? "Đang hủy..." : "Hủy đơn"}
          </button>
        </div>
      </div>
    </div>
  );
}
