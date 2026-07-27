export default function DeleteProductModal({ product, submitting, error, onClose, onConfirm }) {
  if (!product) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-xl font-bold text-red-600">!</div>
        <h2 className="text-lg font-bold text-slate-800">Xóa sản phẩm?</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Bạn đang xóa <strong className="text-slate-700">{product.name}</strong>.
          Nếu sản phẩm đã xuất hiện trong đơn hàng, hệ thống sẽ giữ dữ liệu và chuyển sang ngừng kinh doanh.
        </p>
        {error && <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose} disabled={submitting}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Hủy</button>
          <button type="button" onClick={onConfirm} disabled={submitting}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60">
            {submitting ? "Đang xử lý..." : "Xác nhận xóa"}
          </button>
        </div>
      </div>
    </div>
  );
}
