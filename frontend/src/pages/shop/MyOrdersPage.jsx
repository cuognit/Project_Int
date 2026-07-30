import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cancelOrder, getMyOrders } from "../../api/orderApi.js";
import CancelOrderModal from "../../components/orders/CancelOrderModal.jsx";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge.jsx";
import PaymentStatusBadge from "../../components/orders/PaymentStatusBadge.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";

const STATUSES = [
  { value: "ALL", label: "Tất cả" },
  { value: "PENDING", label: "Chờ xử lý" },
  { value: "CONFIRMED", label: "Đã xác nhận" },
  { value: "SHIPPING", label: "Đang giao" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "CANCELLED", label: "Đã hủy" },
];

const emptyCounts = {
  ALL: 0,
  PENDING: 0,
  CONFIRMED: 0,
  SHIPPING: 0,
  COMPLETED: 0,
  CANCELLED: 0,
};

function SummaryCard({ label, value, tone, icon }) {
  const tones = {
    orange: "border-orange-100 bg-orange-50 text-orange-700",
    indigo: "border-indigo-100 bg-indigo-50 text-indigo-700",
    emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  };
  return (
    <div className={`flex items-center gap-3 rounded-2xl border p-4 ${tones[tone]}`}>
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">{icon}</div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{label}</p>
        <p className="mt-0.5 text-xl font-black">{value}</p>
      </div>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="animate-pulse space-y-4 rounded-3xl border border-slate-200 bg-white p-5">
      <div className="flex justify-between"><div className="h-4 w-40 rounded bg-slate-200" /><div className="h-6 w-24 rounded-full bg-slate-200" /></div>
      <div className="h-px bg-slate-100" />
      {[1, 2].map((item) => (
        <div key={item} className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-xl bg-slate-200" />
          <div className="flex-1 space-y-2"><div className="h-3 w-2/3 rounded bg-slate-200" /><div className="h-3 w-1/3 rounded bg-slate-100" /></div>
        </div>
      ))}
    </div>
  );
}

// Hiển thị, lọc, phân trang và hỗ trợ hủy đơn của khách hàng.
export default function MyOrdersPage() {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [counts, setCounts] = useState(emptyCounts);
  const [pagination, setPagination] = useState({ page: 1, hasMore: false });
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [showSuccessAlert, setShowSuccessAlert] = useState(
    Boolean(location.state?.orderSuccess),
  );
  const [orderToCancel, setOrderToCancel] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  // Tải trang đơn hàng mới hoặc nối thêm vào danh sách hiện tại.
  const loadOrders = useCallback(async (page, append = false) => {
    const requestId = ++requestIdRef.current;
    append ? setLoadingMore(true) : setLoading(true);
    if (!append) setOrders([]);
    setError("");
    try {
      const data = await getMyOrders({
        page,
        limit: 5,
        status,
        search: debouncedSearch,
      });
      if (requestId !== requestIdRef.current) return;
      setOrders((current) => append ? [...current, ...data.items] : data.items);
      setCounts(data.counts || emptyCounts);
      setPagination(data.pagination);
    } catch (err) {
      if (requestId === requestIdRef.current) {
        setError(err?.message || "Không thể tải danh sách đơn hàng.");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [status, debouncedSearch]);

  useEffect(() => {
    loadOrders(1);
  }, [loadOrders, retryKey]);

  const hasFilters = status !== "ALL" || Boolean(debouncedSearch);
  const clearFilters = () => {
    setStatus("ALL");
    setSearch("");
    setDebouncedSearch("");
  };

  // Hủy đơn được chọn và đồng bộ lại danh sách cùng giỏ hàng.
  const handleCancelOrder = async () => {
    if (!orderToCancel) return;
    setCancelLoading(true);
    setCancelError("");
    try {
      await cancelOrder(orderToCancel.id);
      setOrderToCancel(null);
      await loadOrders(1);
    } catch (err) {
      setCancelError(err?.message || "Không thể hủy đơn hàng.");
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {showSuccessAlert && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 font-black text-white">✓</div>
            <div>
              <h4 className="text-xs font-black text-emerald-800">Đặt hàng thành công!</h4>
              <p className="mt-0.5 text-[11px] text-emerald-600">Đơn hàng đang chờ cửa hàng xác nhận.</p>
            </div>
          </div>
          <button onClick={() => setShowSuccessAlert(false)} className="px-2 py-1 text-xs font-bold text-emerald-600">Đóng</button>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-black text-slate-800">Đơn hàng của tôi</h1>
        <p className="mt-1 text-xs text-slate-400">Theo dõi trạng thái và lịch sử mua sắm của bạn.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label="Đang xử lý" value={counts.PENDING + counts.CONFIRMED} tone="orange" icon="🧾" />
        <SummaryCard label="Đang giao" value={counts.SHIPPING} tone="indigo" icon="🚚" />
        <SummaryCard label="Hoàn thành" value={counts.COMPLETED} tone="emerald" icon="✓" />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="absolute left-3.5 top-3 h-4 w-4 text-slate-400">
            <path strokeLinecap="round" d="m21 21-4.35-4.35m1.35-5.65a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
          </svg>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm theo mã đơn hoặc tên sản phẩm..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-10 text-xs font-semibold outline-none transition focus:border-[#ee4d2d] focus:bg-white"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-2.5 px-1 text-sm text-slate-400 hover:text-slate-700" aria-label="Xóa tìm kiếm">×</button>
          )}
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
          {STATUSES.map((item) => (
            <button
              key={item.value}
              onClick={() => setStatus(item.value)}
              className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition ${
                status === item.value
                  ? "bg-[#ee4d2d] text-white shadow-md shadow-orange-100"
                  : "bg-slate-50 text-slate-500 hover:bg-orange-50 hover:text-[#ee4d2d]"
              }`}
            >
              {item.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[9px] ${status === item.value ? "bg-white/20" : "bg-white"}`}>
                {counts[item.value] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-4"><OrderSkeleton /><OrderSkeleton /></div>
      ) : error && orders.length === 0 ? (
        <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center">
          <div className="text-3xl">⚠️</div>
          <p className="mt-3 text-sm font-bold text-rose-700">{error}</p>
          <button onClick={() => setRetryKey((value) => value + 1)} className="mt-4 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-bold text-white">Thử lại</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
          <div className="text-5xl">{hasFilters ? "🔍" : "📦"}</div>
          <h3 className="mt-4 text-lg font-black text-slate-800">
            {hasFilters ? "Không tìm thấy đơn hàng phù hợp" : "Bạn chưa có đơn hàng nào"}
          </h3>
          <p className="mt-2 text-xs text-slate-400">
            {hasFilters ? "Hãy thử từ khóa hoặc trạng thái khác." : "Các đơn hàng sau khi đặt sẽ xuất hiện tại đây."}
          </p>
          {hasFilters ? (
            <button onClick={clearFilters} className="mt-5 rounded-xl bg-slate-800 px-6 py-3 text-xs font-bold text-white">Xóa bộ lọc</button>
          ) : (
            <Link to="/" className="mt-5 inline-block rounded-xl bg-[#ee4d2d] px-6 py-3 text-xs font-bold text-white">Tiếp tục mua sắm</Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const previewItems = order.items?.slice(0, 2) || [];
            const remainingItems = Math.max(0, (order.items?.length || 0) - previewItems.length);
            const totalQuantity = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
            return (
              <article key={order.id} className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-orange-200 hover:shadow-md">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-4">
                  <div>
                    <p className="text-xs font-black text-slate-800">#{order.orderCode}</p>
                    <p className="mt-1 text-[10px] text-slate-400">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PaymentStatusBadge status={order.paymentStatus} />
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>

                <div className="divide-y divide-slate-100">
                  {previewItems.map((item) => (
                    <Link key={item.id} to={`/products/${item.productId}`} className="flex items-center gap-3 px-5 py-4 hover:bg-orange-50/30">
                      <img src={item.product?.imageUrl || "https://picsum.photos/80/80"} alt={item.productName} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-slate-800">{item.productName}</p>
                        <p className="mt-1 text-[10px] text-slate-400">SKU: {item.productSku} · Số lượng: {item.quantity}</p>
                      </div>
                      <span className="shrink-0 text-xs font-black text-slate-700">{formatCurrency(Number(item.totalPrice))}</span>
                    </Link>
                  ))}
                </div>

                {remainingItems > 0 && (
                  <div className="border-t border-slate-100 bg-slate-50/40 px-5 py-2.5 text-center text-[10px] font-bold text-slate-500">
                    và {remainingItems} sản phẩm khác
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 px-5 py-4">
                  <p className="text-[11px] text-slate-400">
                    {totalQuantity} sản phẩm · Thanh toán {order.paymentMethod === "VNPAY" ? "VNPay" : "COD"}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400">Tổng thanh toán</p>
                      <p className="text-lg font-black text-[#ee4d2d]">{formatCurrency(Number(order.totalAmount))}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.status === "PENDING"
                        && !(order.paymentMethod === "VNPAY" && ["PENDING", "REFUNDING"].includes(order.paymentStatus)) && (
                        <button
                          onClick={() => {
                            setCancelError("");
                            setOrderToCancel(order);
                          }}
                          className="rounded-xl border border-rose-200 px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50"
                        >
                          Hủy đơn
                        </button>
                      )}
                      <Link to={`/my-orders/${order.id}`} className="btn-outline-brand inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold">
                        Xem chi tiết
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center">
              <p className="text-xs font-semibold text-rose-700">{error}</p>
              <button
                onClick={() => loadOrders(pagination.page + 1, true)}
                className="mt-2 text-xs font-bold text-rose-700 underline"
              >
                Thử tải lại
              </button>
            </div>
          )}

          {pagination.hasMore && (
            <div className="pt-2 text-center">
              <button
                onClick={() => loadOrders(pagination.page + 1, true)}
                disabled={loadingMore}
                className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-6 py-3 text-xs font-bold text-slate-700 hover:border-orange-300 hover:text-[#ee4d2d] disabled:opacity-60"
              >
                {loadingMore && <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-200 border-t-[#ee4d2d]" />}
                {loadingMore ? "Đang tải..." : "Xem thêm"}
              </button>
            </div>
          )}
        </div>
      )}

      <CancelOrderModal
        open={Boolean(orderToCancel)}
        orderCode={orderToCancel?.orderCode}
        loading={cancelLoading}
        error={cancelError}
        onClose={() => {
          if (!cancelLoading) setOrderToCancel(null);
        }}
        onConfirm={handleCancelOrder}
      />
    </div>
  );
}
