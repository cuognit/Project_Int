import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getAdminOrders,
  updateOrderStatus,
} from "../../api/orderApi.js";
import { useAdminOrderQueue } from "../../context/AdminOrderQueueContext.jsx";
import OrderDrawer from "../../components/orders/OrderDrawer.jsx";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge.jsx";
import PaymentStatusBadge from "../../components/orders/PaymentStatusBadge.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";

const STATUS_TABS = [
  ["ALL", "Tất cả"],
  ["PENDING", "Chờ xử lý"],
  ["CONFIRMED", "Đã xác nhận"],
  ["SHIPPING", "Đang giao"],
  ["COMPLETED", "Hoàn thành"],
  ["CANCELLED", "Đã hủy"],
];
const VALID_STATUSES = new Set(STATUS_TABS.map(([value]) => value));
const EMPTY_COUNTS = {
  ALL: 0,
  PENDING: 0,
  CONFIRMED: 0,
  SHIPPING: 0,
  COMPLETED: 0,
  CANCELLED: 0,
};

function OrdersSkeleton() {
  return (
    <div className="space-y-3 p-5">
      {Array.from({ length: 8 }, (_, index) => (
        <div key={index} className="grid animate-pulse grid-cols-6 gap-4 py-3">
          {Array.from({ length: 6 }, (_, column) => (
            <div key={column} className="h-4 rounded bg-slate-100" />
          ))}
        </div>
      ))}
    </div>
  );
}

// Quản lý hàng đợi đơn chờ xử lý với tìm kiếm và cập nhật realtime.
export default function PendingOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialStatus = String(searchParams.get("status") || "PENDING").toUpperCase();
  const initialPage = Number(searchParams.get("page"));
  const initialSearch = searchParams.get("q") || "";
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalItems: 0,
    totalPages: 1,
  });
  const [status, setStatus] = useState(VALID_STATUSES.has(initialStatus) ? initialStatus : "PENDING");
  const [page, setPage] = useState(Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 1);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [search, setSearch] = useState(initialSearch);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmingId, setConfirmingId] = useState(null);
  const { queueVersion, refreshPendingCount, setPendingCount } = useAdminOrderQueue();

  const selectedOrderId = Number(searchParams.get("orderId")) || null;

  // Tải danh sách đơn theo bộ lọc và hỗ trợ làm mới nền.
  const loadOrders = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    if (!silent) setError("");
    try {
      const data = await getAdminOrders({ page, limit: 20, status, search });
      setItems(data.items || []);
      setCounts(data.counts || EMPTY_COUNTS);
      setPagination(data.pagination);
      if (!search) setPendingCount(Number(data.counts?.PENDING || 0));
    } catch (requestError) {
      if (!silent) {
        setError(requestError?.message || "Không thể tải danh sách đơn hàng.");
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, search, setPendingCount, status]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    if (queueVersion > 0) loadOrders({ silent: true });
    // Queue events refresh in the background; page/search changes are handled above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queueVersion]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    next.set("status", status);
    next.set("page", String(page));
    if (search) next.set("q", search);
    else next.delete("q");
    setSearchParams(next, { replace: true });
    // Only filter state writes these URL values; orderId is preserved separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status]);

  const openOrder = (orderId) => {
    const next = new URLSearchParams(searchParams);
    next.set("orderId", orderId);
    setSearchParams(next);
  };

  const closeOrder = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("orderId");
    setSearchParams(next, { replace: true });
  };

  // Đồng bộ danh sách sau khi trạng thái đơn được thay đổi.
  const handleOrderStatusUpdated = (orderId, newStatus) => {
    const currentOrder = items.find((item) => item.id === orderId);
    const previousStatus = currentOrder?.status;
    const leavesCurrentTab = status !== "ALL" && newStatus !== status;

    if (leavesCurrentTab && items.length === 1 && page > 1) {
      setPage((value) => value - 1);
    }
    setItems((current) => (
      leavesCurrentTab
        ? current.filter((item) => item.id !== orderId)
        : current.map((item) => item.id === orderId ? { ...item, status: newStatus } : item)
    ));
    if (leavesCurrentTab) {
      setPagination((current) => ({
        ...current,
        totalItems: Math.max(0, current.totalItems - 1),
      }));
    }
    if (previousStatus && previousStatus !== newStatus) {
      setCounts((current) => ({
        ...current,
        [previousStatus]: Math.max(0, current[previousStatus] - 1),
        [newStatus]: current[newStatus] + 1,
      }));
      if (previousStatus === "PENDING") {
        setPendingCount((count) => Math.max(0, count - 1));
      } else if (newStatus === "PENDING") {
        setPendingCount((count) => count + 1);
      }
    }
    refreshPendingCount();
  };

  // Xác nhận nhanh đơn chờ xử lý ngay tại danh sách.
  const confirmQuickly = async (order) => {
    if (
      order.paymentMethod === "VNPAY"
      && order.paymentStatus !== "PAID"
    ) {
      return;
    }
    if (!window.confirm(`Xác nhận xử lý đơn hàng #${order.orderCode}?`)) return;
    setConfirmingId(order.id);
    try {
      await updateOrderStatus(order.id, "CONFIRMED");
      handleOrderStatusUpdated(order.id, "CONFIRMED");
    } catch (requestError) {
      window.alert(requestError?.message || "Không thể xác nhận đơn hàng.");
      refreshPendingCount();
    } finally {
      setConfirmingId(null);
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const selectStatus = (nextStatus) => {
    setStatus(nextStatus);
    setPage(1);
  };

  const activeLabel = STATUS_TABS.find(([value]) => value === status)?.[1] || "Đơn hàng";

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">Quản lý đơn hàng</h2>
          <p className="mt-1 text-xs text-slate-400">
            Theo dõi và xử lý đơn hàng theo từng trạng thái, sắp xếp mới nhất trước.
          </p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-right">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-600">{activeLabel}</span>
          <span className="text-xl font-black text-amber-800">{pagination.totalItems} đơn</span>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="flex gap-1 overflow-x-auto border-b border-slate-100 px-5 pt-4">
          {STATUS_TABS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => selectStatus(value)}
              className={`flex shrink-0 items-center gap-2 rounded-t-xl border-b-2 px-4 py-3 text-[11px] font-bold transition ${
                status === value
                  ? "border-indigo-600 bg-indigo-50/60 text-indigo-700"
                  : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              {label}
              <span className={`rounded-full px-2 py-0.5 text-[9px] ${
                status === value ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
              }`}>
                {counts[value] || 0}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <form onSubmit={submitSearch} className="flex min-w-0 flex-1 gap-2 sm:max-w-md">
            <input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Tìm mã đơn, tên hoặc số điện thoại..."
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs text-slate-700 outline-none transition focus:border-indigo-500"
            />
            <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700">
              Tìm kiếm
            </button>
          </form>
          <button
            type="button"
            onClick={() => loadOrders()}
            disabled={loading}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Làm mới
          </button>
        </div>

        {loading ? (
          <OrdersSkeleton />
        ) : error ? (
          <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <p className="text-sm font-bold text-rose-600">{error}</p>
            <button type="button" onClick={() => loadOrders()} className="mt-3 text-xs font-bold text-indigo-600 hover:underline">
              Thử lại
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-600">✓</div>
            <p className="mt-4 text-sm font-bold text-slate-700">Không có đơn hàng {activeLabel.toLowerCase()}</p>
            <p className="mt-1 text-xs text-slate-400">Thử chọn trạng thái khác hoặc thay đổi từ khóa tìm kiếm.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-xs">
              <thead className="border-b border-slate-100 bg-slate-50 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3">Đơn hàng</th>
                  <th className="px-4 py-3">Người nhận</th>
                  <th className="px-4 py-3">Thời gian</th>
                  <th className="px-4 py-3">Thanh toán</th>
                  <th className="px-4 py-3 text-right">Tổng tiền</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((order) => {
                  const cannotConfirm =
                    order.paymentMethod === "VNPAY"
                    && order.paymentStatus !== "PAID";
                  const canConfirmQuickly = order.status === "PENDING";
                  return (
                    <tr
                      key={order.id}
                      onClick={() => openOrder(order.id)}
                      className="cursor-pointer transition hover:bg-indigo-50/30"
                    >
                      <td className="px-5 py-4">
                        <span className="block font-extrabold text-slate-800">#{order.orderCode}</span>
                        <span className="mt-1 inline-block"><OrderStatusBadge status={order.status} /></span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="block font-bold text-slate-700">{order.shippingName}</span>
                        <span className="mt-1 block text-[10px] text-slate-400">{order.shippingPhone}</span>
                      </td>
                      <td className="px-4 py-4 text-slate-500">{formatDate(order.createdAt)}</td>
                      <td className="px-4 py-4">
                        <span className="mr-2 font-bold text-slate-600">{order.paymentMethod}</span>
                        <PaymentStatusBadge status={order.paymentStatus} />
                      </td>
                      <td className="px-4 py-4 text-right font-extrabold text-slate-800">
                        {formatCurrency(Number(order.totalAmount))}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {canConfirmQuickly ? (
                          <button
                            type="button"
                            disabled={cannotConfirm || confirmingId === order.id}
                            title={cannotConfirm ? "Đơn VNPay phải thanh toán thành công trước khi xác nhận" : "Xác nhận đơn hàng"}
                            onClick={(event) => {
                              event.stopPropagation();
                              confirmQuickly(order);
                            }}
                            className="rounded-lg bg-indigo-600 px-3 py-2 text-[10px] font-bold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
                          >
                            {confirmingId === order.id ? "Đang xác nhận..." : "Xác nhận nhanh"}
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-indigo-600">Xem chi tiết →</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && !error && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
            <span className="text-[10px] font-semibold text-slate-400">
              Trang {pagination.page}/{pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 disabled:opacity-40"
              >
                Trước
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-[10px] font-bold text-slate-600 disabled:opacity-40"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      <OrderDrawer
        orderId={selectedOrderId}
        onClose={closeOrder}
        onStatusUpdated={handleOrderStatusUpdated}
      />
    </div>
  );
}
