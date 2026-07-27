import { Link } from "react-router-dom";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";
import OrderStatusBadge from "./OrderStatusBadge.jsx";

export default function OrderTable({ orders }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-4">Mã đơn</th>
            <th className="p-4">Ngày tạo</th>
            <th className="p-4">Trạng thái</th>
            <th className="p-4">Tổng tiền</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr className="border-t border-slate-100" key={order.id}>
              <td className="p-4">
                <Link
                  className="font-medium text-blue-600"
                  to={`/orders/${order.id}`}
                >
                  #{order.id}
                </Link>
              </td>
              <td className="p-4">{formatDate(order.createdAt)}</td>
              <td className="p-4">
                <OrderStatusBadge status={order.status} />
              </td>
              <td className="p-4 font-semibold">
                {formatCurrency(order.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
