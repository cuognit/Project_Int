import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getOrder } from "../../api/orderApi.js";
import PaymentStatusBadge from "../../components/orders/PaymentStatusBadge.jsx";

const terminalStatuses = new Set(["PAID", "FAILED", "REFUNDED", "CANCELLED"]);

// Đọc kết quả VNPay từ URL và hiển thị trạng thái thanh toán.
export default function VnpayResultPage() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const invalidSignature = params.get("gatewayStatus") === "INVALID_SIGNATURE";
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(invalidSignature ? "Phản hồi VNPay không hợp lệ." : "");

  useEffect(() => {
    if (!orderId || invalidSignature) return undefined;
    let active = true;
    let attempts = 0;
    const load = async () => {
      try {
        const data = await getOrder(orderId);
        if (!active) return;
        setOrder(data);
        if (!terminalStatuses.has(data.paymentStatus) && attempts < 15) {
          attempts += 1;
          window.setTimeout(load, 2000);
        }
      } catch (requestError) {
        if (active) setError(requestError?.message || "Không thể kiểm tra thanh toán.");
      }
    };
    load();
    return () => { active = false; };
  }, [orderId, invalidSignature]);

  const pending = order && !terminalStatuses.has(order.paymentStatus);
  return (
    <div className="mx-auto max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="text-5xl">{order?.paymentStatus === "PAID" ? "✅" : pending ? "⏳" : "⚠️"}</div>
      <h1 className="mt-4 text-xl font-black text-slate-800">Kết quả thanh toán VNPay</h1>
      {error ? (
        <p className="mt-3 text-sm font-semibold text-rose-600">{error}</p>
      ) : order ? (
        <>
          <div className="mt-4"><PaymentStatusBadge status={order.paymentStatus} /></div>
          <p className="mt-3 text-sm text-slate-500">
            Đơn hàng <span className="font-bold text-slate-800">{order.orderCode}</span>
          </p>
          {pending && <p className="mt-2 text-xs text-slate-400">Đang chờ VNPay xác nhận giao dịch…</p>}
        </>
      ) : (
        <div className="mx-auto mt-5 h-8 w-8 animate-spin rounded-full border-4 border-orange-200 border-t-[#ee4d2d]" />
      )}
      <div className="mt-6 flex justify-center gap-3">
        {order && (
          <Link to={`/my-orders/${order.id}`} className="rounded-xl bg-[#ee4d2d] px-4 py-2.5 text-xs font-bold text-white">
            Xem đơn hàng
          </Link>
        )}
        <Link to="/my-orders" className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600">
          Đơn hàng của tôi
        </Link>
      </div>
    </div>
  );
}
