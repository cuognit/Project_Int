import { useEffect, useState } from "react";
import { getOrder, updateOrderStatus } from "../../api/orderApi.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";
import OrderStatusBadge from "./OrderStatusBadge.jsx";

export default function OrderDrawer({ orderId, onClose, onStatusUpdated }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    setLoading(true);
    setError(null);
    setIsOpen(false);

    // Trigger slide-in after mount
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsOpen(true);
      });
    });

    getOrder(orderId)
      .then((data) => {
        setOrder(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Không thể tải chi tiết đơn hàng");
        setLoading(false);
      });
  }, [orderId]);

  const handleClose = () => {
    setIsOpen(false);
    // Wait for slide-out animation to finish before actually closing
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleStatusChange = async (newStatus) => {
    if (!order) return;
    setUpdating(true);
    try {
      const updated = await updateOrderStatus(order.id, newStatus);
      setOrder(updated);
      if (onStatusUpdated) {
        onStatusUpdated(order.id, newStatus);
      }
    } catch (err) {
      console.error(err);
      alert("Cập nhật trạng thái thất bại!");
    } finally {
      setUpdating(false);
    }
  };

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-300 ease-out ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      />

      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        {/* Drawer Panel */}
        <div
          className={`w-screen max-w-md bg-white shadow-2xl flex flex-col h-full transform transition-all duration-300 ease-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="px-6 py-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-800">
                  Đơn hàng {order ? `#${order.orderCode}` : "..."}
                </h3>
                {order && <OrderStatusBadge status={order.status} />}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {order && `Đặt ngày: ${formatDate(order.createdAt)}`}
              </p>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
                <span className="text-sm text-slate-500 font-medium">
                  Đang tải chi tiết đơn...
                </span>
              </div>
            ) : error ? (
              <div className="rounded-xl bg-red-50 p-4 border border-red-100 text-center">
                <p className="text-sm font-semibold text-red-700">{error}</p>
                <button
                  onClick={() =>
                    getOrder(orderId)
                      .then(setOrder)
                      .catch(() => {})
                  }
                  className="mt-3 text-xs font-bold text-red-600 hover:underline"
                >
                  Thử lại
                </button>
              </div>
            ) : (
              <>
                {/* Status Updater */}
                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100/50">
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-700 mb-2">
                    Cập nhật Trạng thái Đơn
                  </label>
                  <div className="relative">
                    <select
                      value={order.status}
                      disabled={updating}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
                    >
                      <option value="PENDING">Chờ xử lý (Pending)</option>
                      <option value="CONFIRMED">Đã xác nhận (Confirmed)</option>
                      <option value="SHIPPING">
                        Đang giao hàng (Shipping)
                      </option>
                      <option value="COMPLETED">
                        Đã hoàn thành (Completed)
                      </option>
                      <option value="CANCELLED">Đã hủy (Cancelled)</option>
                    </select>
                    {updating && (
                      <div className="absolute right-3 top-3">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"></div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Customer / Shipping Info */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Thông tin Giao hàng
                  </h4>
                  <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 space-y-3">
                    <div className="flex items-start gap-3">
                      <svg
                        className="h-5 w-5 text-slate-400 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-bold text-slate-700">
                          {order.shippingName}
                        </p>
                        <p className="text-xs text-slate-400">
                          Người nhận hàng
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <svg
                        className="h-5 w-5 text-slate-400 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 00.096.867l-1.1 1.486a10.539 10.539 0 005.252 5.252l1.486-1.1a1 1 0 00.867-.096l2.2.548A1 1 0 0121 16.48V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-slate-700">
                          {order.shippingPhone}
                        </p>
                        <p className="text-xs text-slate-400">Điện thoại</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <svg
                        className="h-5 w-5 text-slate-400 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-slate-700 leading-normal">
                          {order.shippingAddress}
                        </p>
                        <p className="text-xs text-slate-400">
                          Địa chỉ nhận hàng
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                    Chi tiết Sản phẩm ({order.items?.length || 0})
                  </h4>
                  <div className="divide-y divide-slate-100">
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="py-3 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              item.product?.imageUrl ||
                              "https://picsum.photos/60/60"
                            }
                            alt={item.productName}
                            className="h-10 w-10 rounded-lg bg-slate-100 object-cover"
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-800 leading-tight">
                              {item.productName}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              SKU: {item.productSku} | SL: {item.quantity}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-slate-800">
                            {formatCurrency(Number(item.totalPrice))}
                          </p>
                          <p className="text-xs text-slate-400">
                            {formatCurrency(Number(item.unitPrice))}/sp
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ghi chú */}
                {order.note && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Ghi chú đơn hàng
                    </h4>
                    <div className="rounded-xl bg-amber-50/50 border border-amber-100/70 p-3">
                      <p className="text-xs font-medium text-amber-800 italic leading-relaxed">
                        "{order.note}"
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Billing Summary */}
          {order && !loading && (
            <div className="p-6 bg-slate-50 border-t border-slate-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Tạm tính</span>
                <span className="text-slate-800 font-semibold">
                  {formatCurrency(Number(order.subtotal))}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">
                  Phí vận chuyển
                </span>
                <span className="text-slate-800 font-semibold">
                  {Number(order.shippingFee) === 0 ? (
                    <span className="text-emerald-600 font-bold">Miễn phí</span>
                  ) : (
                    formatCurrency(Number(order.shippingFee))
                  )}
                </span>
              </div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between text-sm font-bold text-emerald-600">
                  <span>Voucher {order.voucherCode}</span>
                  <span>-{formatCurrency(Number(order.discountAmount))}</span>
                </div>
              )}
              <div className="flex justify-between text-base pt-2 border-t border-slate-200">
                <span className="text-slate-800 font-bold">
                  Tổng thanh toán
                </span>
                <span className="text-indigo-600 font-extrabold text-lg">
                  {formatCurrency(Number(order.totalAmount))}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
