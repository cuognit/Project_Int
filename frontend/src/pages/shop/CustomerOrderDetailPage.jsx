import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { cancelOrder, getOrder } from "../../api/orderApi.js";
import CancelOrderModal from "../../components/orders/CancelOrderModal.jsx";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge.jsx";
import OrderTrackingSteps from "../../components/orders/OrderTrackingSteps.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";

export default function CustomerOrderDetailPage() {
  const { orderId } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  useEffect(() => {
    getOrder(orderId).then(setOrder).catch((err) => {
      setError(err?.message || "Không thể tải đơn hàng.");
    });
  }, [orderId]);

  const handleCancelOrder = async () => {
    setCancelLoading(true);
    setCancelError("");
    try {
      const updatedOrder = await cancelOrder(order.id);
      setOrder(updatedOrder);
      setCancelModalOpen(false);
    } catch (err) {
      setCancelError(err?.message || "Không thể hủy đơn hàng.");
    } finally {
      setCancelLoading(false);
    }
  };

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center">
        <p className="font-bold text-rose-700">{error}</p>
        <Link to="/my-orders" className="mt-4 inline-block text-sm font-bold text-[#ee4d2d]">Quay lại đơn hàng</Link>
      </div>
    );
  }
  if (!order) {
    return <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-orange-200 border-t-[#ee4d2d]" />;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {location.state?.orderSuccess && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
          ✓ Đặt hàng thành công. Đơn hàng đang chờ cửa hàng xác nhận.
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/my-orders" className="text-xs font-bold text-slate-400 hover:text-[#ee4d2d]">← Đơn hàng của tôi</Link>
          <h1 className="mt-2 text-2xl font-black text-slate-800">Đơn hàng #{order.orderCode}</h1>
          <p className="mt-1 text-xs text-slate-400">Đặt lúc {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          {order.status === "PENDING" && (
            <button
              onClick={() => {
                setCancelError("");
                setCancelModalOpen(true);
              }}
              className="rounded-xl border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50"
            >
              Hủy đơn
            </button>
          )}
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <OrderTrackingSteps status={order.status} />

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 p-5">
            <h2 className="text-sm font-black text-slate-800">Sản phẩm ({order.items?.length || 0})</h2>
          </div>
          <div className="max-h-[416px] divide-y divide-slate-100 overflow-y-auto overscroll-contain [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]">
            {order.items?.map((item) => (
              <div key={item.id} className="flex items-center gap-4 p-5">
                <Link to={`/products/${item.productId}`}>
                  <img src={item.product?.imageUrl || "https://picsum.photos/80/80"} alt={item.productName} className="h-16 w-16 rounded-xl object-cover" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/products/${item.productId}`} className="block truncate text-xs font-bold text-slate-800 hover:text-[#ee4d2d]">{item.productName}</Link>
                  <p className="mt-1 text-[10px] text-slate-400">SKU: {item.productSku}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatCurrency(Number(item.unitPrice))} × {item.quantity}</p>
                </div>
                <span className="text-sm font-black text-slate-800">{formatCurrency(Number(item.totalPrice))}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <section className="rounded-3xl border border-slate-200 bg-white p-5">
            <h2 className="border-b border-slate-100 pb-3 text-sm font-black text-slate-800">Thông tin nhận hàng</h2>
            <dl className="mt-4 space-y-3 text-xs">
              <div><dt className="text-slate-400">Người nhận</dt><dd className="mt-1 font-bold text-slate-800">{order.shippingName}</dd></div>
              <div><dt className="text-slate-400">Số điện thoại</dt><dd className="mt-1 font-bold text-slate-800">{order.shippingPhone}</dd></div>
              <div><dt className="text-slate-400">Địa chỉ</dt><dd className="mt-1 font-semibold leading-relaxed text-slate-700">{order.shippingAddress}</dd></div>
              {order.note && <div><dt className="text-slate-400">Ghi chú</dt><dd className="mt-1 rounded-xl bg-amber-50 p-3 text-slate-700">{order.note}</dd></div>}
            </dl>
          </section>

          <section className="rounded-3xl border border-orange-100 bg-white p-5">
            <h2 className="border-b border-slate-100 pb-3 text-sm font-black text-slate-800">Thanh toán COD</h2>
            <div className="space-y-3 py-4 text-xs">
              <div className="flex justify-between text-slate-500"><span>Tạm tính</span><span>{formatCurrency(Number(order.subtotal))}</span></div>
              <div className="flex justify-between text-slate-500"><span>Phí vận chuyển</span><span className="font-bold text-emerald-600">{Number(order.shippingFee) === 0 ? "Miễn phí" : formatCurrency(Number(order.shippingFee))}</span></div>
              {Number(order.discountAmount) > 0 && (
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>Voucher {order.voucherCode}</span>
                  <span>-{formatCurrency(Number(order.discountAmount))}</span>
                </div>
              )}
            </div>
            <div className="flex items-end justify-between border-t border-slate-100 pt-4">
              <span className="text-sm font-black text-slate-800">Tổng cộng</span>
              <span className="text-xl font-black text-[#ee4d2d]">{formatCurrency(Number(order.totalAmount))}</span>
            </div>
          </section>
        </div>
      </div>
      <CancelOrderModal
        open={cancelModalOpen}
        orderCode={order.orderCode}
        loading={cancelLoading}
        error={cancelError}
        onClose={() => {
          if (!cancelLoading) setCancelModalOpen(false);
        }}
        onConfirm={handleCancelOrder}
      />
    </div>
  );
}
