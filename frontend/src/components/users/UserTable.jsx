import { Link } from 'react-router-dom';

export default function UserTable({ users }) {
  return <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <table className="w-full text-left">
      <thead className="bg-slate-50">
        <tr>
          <th className="p-4">Họ tên</th>
          <th className="p-4">Email</th>
          <th className="p-4">Điện thoại</th>
          <th className="p-4">Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {users.map((user) => (
          <tr className="border-t border-slate-100" key={user.id}>
            <td className="p-4 font-medium">{user.name}</td>
            <td className="p-4">{user.email}</td>
            <td className="p-4">{user.phone}</td>
            <td className="p-4">
              <Link className="text-blue-600 hover:underline" to={`/users/${user.id}/orders`}>
                Xem đơn hàng
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>;
}
