import { useCallback, useEffect, useState } from "react";
import {
  getAdminPayment,
  getAdminPayments,
  reconcilePayment,
  refundPayment,
} from "../../api/paymentApi.js";
import PaymentStatusBadge from "../../components/orders/PaymentStatusBadge.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";

const toDateInput = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
};

const statuses = [
  ["ALL", "Tất cả"],
  ["PENDING", "Chờ thanh toán"],
  ["PAID", "Đã thanh toán"],
  ["FAILED", "Thất bại"],
  ["REFUNDING", "Đang hoàn"],
  ["REFUNDED", "Đã hoàn"],
  ["REFUND_FAILED", "Hoàn lỗi"],
];

// Quản lý tra cứu, đối soát và hoàn tiền các giao dịch.
export default function PaymentsPage() {
  const today = new Date();
  const monthAgo = new Date(today);
  monthAgo.setDate(monthAgo.getDate() - 30);
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
    from: toDateInput(monthAgo),
    to: toDateInput(today),
  });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], summary: { vnpay: {}, cod: {} }, pagination: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [actionLoading, setActionLoading] = useState("");
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");

  // Tải danh sách giao dịch theo bộ lọc và trang hiện tại.
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await getAdminPayments({ ...filters, page, limit: 20 }));
    } catch (requestError) {
      setError(requestError?.message || "Không thể tải giao dịch.");
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    const timer = window.setTimeout(load, 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  // Tải và mở chi tiết giao dịch được chọn.
  const openDetail = async (id) => {
    setActionLoading(`detail-${id}`);
    try {
      setSelected(await getAdminPayment(id));
    } catch (requestError) {
      setError(requestError?.message || "Không thể tải chi tiết giao dịch.");
    } finally {
      setActionLoading("");
    }
  };

  // Đối soát giao dịch với VNPay rồi làm mới dữ liệu.
  const reconcile = async (payment) => {
    setActionLoading(`reconcile-${payment.id}`);
    setError("");
    try {
      const updated = await reconcilePayment(payment.id);
      setSelected(updated);
      await load();
    } catch (requestError) {
      setError(requestError?.message || "Đối soát thất bại.");
    } finally {
      setActionLoading("");
    }
  };

  // Gửi yêu cầu hoàn tiền cùng lý do đã nhập.
  const submitRefund = async () => {
    if (!selected || refundReason.trim().length < 10) return;
    setActionLoading(`refund-${selected.id}`);
    setError("");
    try {
      const updated = await refundPayment(selected.id, refundReason.trim());
      setSelected(updated);
      setRefundOpen(false);
      setRefundReason("");
      await load();
    } catch (requestError) {
      setError(requestError?.message || "Hoàn tiền thất bại.");
    } finally {
      setActionLoading("");
    }
  };

  const vnpay = data.summary?.vnpay || {};
  const cards = [
    ["VNPay đã thu", vnpay.PAID?.amount || 0, "text-emerald-700 bg-emerald-50"],
    ["VNPay chờ xử lý", vnpay.PENDING?.amount || 0, "text-amber-700 bg-amber-50"],
    ["VNPay đã hoàn", vnpay.REFUNDED?.amount || 0, "text-blue-700 bg-blue-50"],
    ["COD đã thu", data.summary?.cod?.collected || 0, "text-indigo-700 bg-indigo-50"],
    ["COD chờ thu", data.summary?.cod?.pending || 0, "text-slate-700 bg-slate-100"],
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Quản lý thanh toán</h1>
        <p className="mt-1 text-xs text-slate-400">Theo dõi VNPay, tổng hợp COD, đối soát và hoàn tiền.</p>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(([label, value, tone]) => (
          <div key={label} className={`rounded-2xl p-4 ${tone}`}>
            <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</p>
            <p className="mt-2 text-lg font-black">{formatCurrency(Number(value))}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_150px_150px]">
        <input
          value={filters.search}
          onChange={(event) => { setFilters((current) => ({ ...current, search: event.target.value })); setPage(1); }}
          placeholder="Mã đơn, mã giao dịch, email..."
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-indigo-500"
        />
        <select
          value={filters.status}
          onChange={(event) => { setFilters((current) => ({ ...current, status: event.target.value })); setPage(1); }}
          className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold"
        >
          {statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <input type="date" value={filters.from} onChange={(event) => { setFilters((current) => ({ ...current, from: event.target.value })); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs" />
        <input type="date" value={filters.to} onChange={(event) => { setFilters((current) => ({ ...current, to: event.target.value })); setPage(1); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Đơn hàng</th>
                <th className="px-4 py-3">Khách hàng</th>
                <th className="px-4 py-3">Giao dịch</th>
                <th className="px-4 py-3">Số tiền</th>
                <th className="px-4 py-3">Trạng thái</th>
                <th className="px-4 py-3">Thời gian</th>
                <th className="px-4 py-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="7" className="p-10 text-center text-slate-400">Đang tải...</td></tr>
              ) : data.items.length === 0 ? (
                <tr><td colSpan="7" className="p-10 text-center text-slate-400">Không có giao dịch phù hợp.</td></tr>
              ) : data.items.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 font-bold text-indigo-700">{payment.order?.orderCode}</td>
                  <td className="px-4 py-3"><p className="font-semibold text-slate-700">{payment.order?.user?.fullName}</p><p className="text-[10px] text-slate-400">{payment.order?.user?.email}</p></td>
                  <td className="px-4 py-3"><p className="font-mono text-[10px] text-slate-600">{payment.transactionNo || payment.txnRef}</p><p className="text-[10px] text-slate-400">{payment.bankCode || "VNPay"}</p></td>
                  <td className="px-4 py-3 font-black text-slate-800">{formatCurrency(Number(payment.amount))}</td>
                  <td className="px-4 py-3"><PaymentStatusBadge status={payment.status} /></td>
                  <td className="px-4 py-3 text-slate-500">{formatDate(payment.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openDetail(payment.id)} disabled={Boolean(actionLoading)} className="rounded-lg border border-indigo-200 px-3 py-1.5 font-bold text-indigo-600 disabled:opacity-50">
                      {actionLoading === `detail-${payment.id}` ? "..." : "Chi tiết"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs">
          <span className="text-slate-400">{data.pagination?.totalItems || 0} giao dịch</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Trước</button>
            <span className="px-2 py-1.5 font-bold">{page}/{data.pagination?.totalPages || 1}</span>
            <button disabled={page >= (data.pagination?.totalPages || 1)} onClick={() => setPage((value) => value + 1)} className="rounded-lg border px-3 py-1.5 disabled:opacity-40">Sau</button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div><h2 className="text-lg font-black text-slate-800">Giao dịch {selected.order?.orderCode}</h2><p className="mt-1 font-mono text-[10px] text-slate-400">{selected.txnRef}</p></div>
              <button onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">✕</button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Số tiền</p><p className="mt-1 font-black">{formatCurrency(Number(selected.amount))}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Trạng thái</p><div className="mt-1"><PaymentStatusBadge status={selected.status} /></div></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Mã VNPay</p><p className="mt-1 font-semibold">{selected.transactionNo || "Chưa có"}</p></div>
              <div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Ngân hàng</p><p className="mt-1 font-semibold">{selected.bankCode || "Chưa có"}</p></div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {!["REFUNDED", "REFUNDING"].includes(selected.status) && (
                <button onClick={() => reconcile(selected)} disabled={Boolean(actionLoading)} className="rounded-xl border border-indigo-200 px-4 py-2.5 text-xs font-bold text-indigo-600 disabled:opacity-50">Đối soát VNPay</button>
              )}
              {selected.status === "PAID" && selected.order?.status === "PENDING" && (
                <button onClick={() => setRefundOpen(true)} disabled={Boolean(actionLoading)} className="rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">Hoàn tiền toàn phần</button>
              )}
            </div>
            <div className="mt-6">
              <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Lịch sử thao tác</h3>
              <div className="mt-2 space-y-2">
                {selected.actions?.length ? selected.actions.map((action) => (
                  <div key={action.id} className="rounded-xl border border-slate-100 p-3 text-xs">
                    <div className="flex justify-between"><span className="font-bold">{action.action === "REFUND" ? "Hoàn tiền" : "Đối soát"} · {action.status}</span><span className="text-slate-400">{formatDate(action.createdAt)}</span></div>
                    <p className="mt-1 text-slate-500">{action.reason || action.responseMessage || "Không có ghi chú"}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{action.admin?.fullName || action.admin?.email}</p>
                  </div>
                )) : <p className="text-xs text-slate-400">Chưa có thao tác thủ công.</p>}
              </div>
            </div>
          </div>
        </div>
      )}

      {refundOpen && selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6">
            <h2 className="text-lg font-black text-slate-800">Xác nhận hoàn tiền</h2>
            <p className="mt-2 text-xs text-slate-500">Đơn <b>{selected.order?.orderCode}</b> · Hoàn toàn bộ <b>{formatCurrency(Number(selected.amount))}</b></p>
            <textarea value={refundReason} onChange={(event) => setRefundReason(event.target.value)} maxLength={500} rows={4} placeholder="Nhập lý do hoàn tiền (ít nhất 10 ký tự)" className="mt-4 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-rose-400" />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setRefundOpen(false); setRefundReason(""); }} disabled={Boolean(actionLoading)} className="rounded-xl border px-4 py-2 text-xs font-bold">Đóng</button>
              <button onClick={submitRefund} disabled={refundReason.trim().length < 10 || Boolean(actionLoading)} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                {actionLoading ? "Đang hoàn..." : "Xác nhận hoàn tiền"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
