import { formatCurrency } from "../../utils/formatCurrency.js";
export default function OrderItemsTable({ items }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-left">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-4">Sản phẩm</th>
            <th className="p-4">Số lượng</th>
            <th className="p-4">Đơn giá</th>
            <th className="p-4">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr className="border-t" key={item.id}>
              <td className="p-4">{item.productName}</td>
              <td className="p-4">{item.quantity}</td>
              <td className="p-4">{formatCurrency(item.unitPrice)}</td>
              <td className="p-4 font-semibold">
                {formatCurrency(item.quantity * item.unitPrice)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
