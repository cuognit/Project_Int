import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { getUsers, adminUpdateUser, updateUserAccess } from "../../api/userApi.js";
import { getOrders } from "../../api/orderApi.js";
import { formatCurrency } from "../../utils/formatCurrency.js";
import { formatDate } from "../../utils/formatDate.js";
import OrderStatusBadge from "../../components/orders/OrderStatusBadge.jsx";
import OrderDrawer from "../../components/orders/OrderDrawer.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function UsersPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedUser, setSelectedUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(false);
  const [activeTab, setActiveTab] = useState("ALL");

  // Drawer state
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  useEffect(() => {
    const orderId = Number(searchParams.get("orderId"));
    setSelectedOrderId(
      Number.isInteger(orderId) && orderId > 0 ? orderId : null,
    );
  }, [searchParams]);

  const closeOrderDrawer = () => {
    setSelectedOrderId(null);
    if (searchParams.has("orderId")) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("orderId");
      setSearchParams(nextParams, { replace: true });
    }
  };

  // Edit User Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({ fullName: "", phone: "", address: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const openEditModal = () => {
    if (!selectedUser) return;
    setEditFormData({
      fullName: selectedUser.fullName || "",
      phone: selectedUser.phone || "",
      address: selectedUser.address || "",
    });
    setEditError("");
    setIsEditModalOpen(true);
  };

  const [isAccessModalOpen, setIsAccessModalOpen] = useState(false);
  const [accessFormData, setAccessFormData] = useState({
    role: "customer",
    isActive: true,
  });
  const [accessLoading, setAccessLoading] = useState(false);
  const [accessError, setAccessError] = useState("");

  const openAccessModal = () => {
    if (!selectedUser) return;
    setAccessFormData({
      role: selectedUser.role || "customer",
      isActive: selectedUser.isActive !== false,
    });
    setAccessError("");
    setIsAccessModalOpen(true);
  };

  const handleSaveAccess = async (event) => {
    event.preventDefault();
    if (!selectedUser) return;
    const changesRole = accessFormData.role !== selectedUser.role;
    const changesStatus =
      accessFormData.isActive !== (selectedUser.isActive !== false);
    if (
      (changesRole || changesStatus) &&
      !window.confirm(
        accessFormData.isActive
          ? "Xác nhận thay đổi quyền truy cập của người dùng này?"
          : "Khóa tài khoản sẽ đăng xuất người dùng khỏi tất cả thiết bị. Tiếp tục?",
      )
    ) {
      return;
    }
    setAccessLoading(true);
    setAccessError("");
    try {
      const response = await updateUserAccess(selectedUser.id, accessFormData);
      setUsers((current) =>
        current.map((item) =>
          item.id === selectedUser.id ? { ...item, ...response.data } : item,
        ),
      );
      setSelectedUser((current) => ({ ...current, ...response.data }));
      setIsAccessModalOpen(false);
    } catch (error) {
      setAccessError(
        error?.message || "Không thể cập nhật quyền và trạng thái tài khoản.",
      );
    } finally {
      setAccessLoading(false);
    }
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditLoading(true);
    setEditError("");
    try {
      const res = await adminUpdateUser(selectedUser.id, editFormData);
      setSelectedUser((prev) => ({ ...prev, ...res.data }));
      setIsEditModalOpen(false);
      fetchUsersList();
    } catch (err) {
      setEditError(err?.response?.data?.message || err?.message || "Cập nhật thất bại.");
    } finally {
      setEditLoading(false);
    }
  };

  // Fetch all users on mount
  const fetchUsersList = () => {
    setUsersLoading(true);
    getUsers()
      .then((data) => {
        setUsers(data);
        setUsersLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setUsersError(true);
        setUsersLoading(false);
      });
  };

  useEffect(() => {
    fetchUsersList();
  }, []);

  // Sync selected user details and fetch orders when userId changes
  useEffect(() => {
    if (userId && users.length) {
      const u = users.find((x) => x.id === parseInt(userId, 10));
      if (u) {
        setSelectedUser(u);
        // Load orders for this user
        setOrdersLoading(true);
        setOrdersError(false);
        getOrders(u.id)
          .then((orderList) => {
            setOrders(orderList);
            setOrdersLoading(false);
          })
          .catch((err) => {
            console.error(err);
            setOrdersError(true);
            setOrdersLoading(false);
          });
      } else {
        setSelectedUser(null);
        setOrders([]);
      }
    } else {
      setSelectedUser(null);
      setOrders([]);
    }
  }, [userId, users]);

  // Handler for updating status in Drawer
  const handleOrderStatusUpdated = (orderId, newStatus) => {
    setOrders((prevOrders) =>
      prevOrders.map((ord) =>
        ord.id === orderId ? { ...ord, status: newStatus } : ord,
      ),
    );
    getUsers()
      .then((data) => {
        setUsers(data);
      })
      .catch((err) => console.error(err));
  };

  // Filter users based on search query
  const filteredUsers = users.filter((user) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = (
      user.fullName.toLowerCase().includes(query) ||
      (user.phone && user.phone.includes(query)) ||
      (user.email && user.email.toLowerCase().includes(query))
    );
    const matchesRole = roleFilter === "ALL" || user.role === roleFilter;
    const matchesStatus =
      statusFilter === "ALL" ||
      (statusFilter === "ACTIVE" ? user.isActive !== false : user.isActive === false);
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filter orders based on active tab
  const filteredOrders = orders.filter((order) => {
    if (activeTab === "ALL") return true;
    return order.status === activeTab;
  });

  const totalSpendForSelected = selectedUser ? selectedUser.totalSpend : 0;
  const totalOrdersForSelected = orders.length;

  const completedOrders = orders.filter((o) => o.status === "COMPLETED").length;
  const completionRate = totalOrdersForSelected
    ? Math.round((completedOrders / totalOrdersForSelected) * 100)
    : 0;

  const tabOptions = [
    { value: "ALL", label: "Tất cả" },
    { value: "PENDING", label: "Chờ xử lý" },
    { value: "CONFIRMED", label: "Xác nhận" },
    { value: "SHIPPING", label: "Đang giao" },
    { value: "COMPLETED", label: "Đã giao" },
    { value: "CANCELLED", label: "Đã hủy" },
  ];

  return (
    <div className="flex flex-1 min-h-0 gap-6 select-none">
      {/* LEFT COLUMN: User list sidebar */}
      <div className="w-80 flex flex-col bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {/* Search header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-800 mb-3">
            Danh sách Người dùng
          </h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Tìm tên, SĐT, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
            />
            <svg
              className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <select
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-600 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">Mọi vai trò</option>
              <option value="admin">Admin</option>
              <option value="customer">Customer</option>
            </select>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-slate-600 focus:border-indigo-500 focus:outline-none"
            >
              <option value="ALL">Mọi trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="INACTIVE">Đã khóa</option>
            </select>
          </div>
        </div>

        {/* Users scroll container */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {usersLoading ? (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 mx-auto mb-2"></div>
              Đang tải người dùng...
            </div>
          ) : usersError ? (
            <div className="p-6 text-center text-red-500 text-xs font-medium">
              Lỗi tải dữ liệu người dùng.
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs italic">
              Không tìm thấy người dùng.
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedUser && selectedUser.id === user.id;
              return (
                <div
                  key={user.id}
                  onClick={() => navigate(`/admin/users/${user.id}`)}
                  className={`p-4 cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "bg-indigo-50/70 border-l-4 border-indigo-600 pl-3"
                      : "hover:bg-slate-50 border-l-4 border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`text-sm font-bold truncate pr-2 ${isSelected ? "text-indigo-900" : "text-slate-800"}`}
                    >
                      {user.fullName}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
                      {user.totalOrders} đơn
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-0.5 truncate">
                    <p className="truncate">{user.email}</p>
                    <p className="font-semibold text-slate-500">
                      {user.phone || "Chưa cập nhật SĐT"}
                    </p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold uppercase ${
                        user.role === "admin"
                          ? "bg-violet-100 text-violet-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {user.role === "admin" ? "Admin" : "Customer"}
                      </span>
                      <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-extrabold ${
                        user.isActive !== false
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}>
                        {user.isActive !== false ? "Hoạt động" : "Đã khóa"}
                      </span>
                    </div>
                    {user.totalSpend > 0 && (
                      <p className="text-indigo-600 font-bold mt-1 text-xs">
                        {formatCurrency(user.totalSpend)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Detail area */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col">
        {!selectedUser ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/20">
            <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mb-4 shadow-sm">
              <svg
                className="h-8 w-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0110.089 20c-2.202 0-4.218-.624-5.922-1.703m-1.353-3.6C1.228 15.6 1 16.63 1 17.7c0 1.22.38 2.35 1.025 3.286M12 8.25a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm10.5 6a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0zM3.75 18a.75.75 0 00-.75.75c0 .44.07.86.21 1.25H6.5a1.875 1.875 0 001.875-1.875V19.5a.75.75 0 00-.75-.75H3.75zM12 15.75a3 3 0 01-3-3V12a3 3 0 013-3h.008a3 3 0 013 3v.75a3 3 0 01-3 3z"
                />
              </svg>
            </div>
            <h4 className="text-base font-bold text-slate-800 mb-1">
              Quản lý Đơn hàng theo Người dùng
            </h4>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Chọn một khách hàng ở danh sách bên trái để xem lịch sử mua sắm,
              thống kê chi tiết và cập nhật các đơn hàng đang xử lý.
            </p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-indigo-100 text-indigo-700 font-extrabold rounded-xl flex items-center justify-center text-sm border border-indigo-200 shrink-0">
                    {selectedUser.fullName
                      .split(" ")
                      .pop()
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-800">
                      {selectedUser.fullName}
                    </h2>
                    <div className="mt-1 flex gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold uppercase ${
                        selectedUser.role === "admin"
                          ? "bg-violet-100 text-violet-700"
                          : "bg-blue-100 text-blue-700"
                      }`}>
                        {selectedUser.role === "admin" ? "Admin" : "Customer"}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-extrabold ${
                        selectedUser.isActive !== false
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}>
                        {selectedUser.isActive !== false ? "Đang hoạt động" : "Đã khóa"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedUser.email} | SĐT:{" "}
                      {selectedUser.phone || "Chưa cập nhật"}
                    </p>
                  </div>
                </div>
                {selectedUser.address && (
                  <p className="text-[11px] text-blue-700 mt-2 flex items-center gap-1.5">
                    <svg
                      className="h-3.5 w-3.5 text-blue-700 inline"
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
                    </svg>
                    Địa chỉ: {selectedUser.address}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={openAccessModal}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-xs font-bold text-indigo-700 transition-all hover:bg-indigo-100"
                >
                  Phân quyền & Trạng thái
                </button>
                <button
                  onClick={openEditModal}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
                >
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Sửa thông tin
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-white border-b border-slate-100">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50 text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tổng Đơn Hàng
                </span>
                <span className="block text-lg font-extrabold text-slate-800 mt-1">
                  {totalOrdersForSelected}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50 text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tổng Chi Tiêu
                </span>
                <span className="block text-lg font-extrabold text-indigo-600 mt-1">
                  {formatCurrency(totalSpendForSelected)}
                </span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100/50 text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Tỷ Lệ Thành Công
                </span>
                <span className="block text-lg font-extrabold text-emerald-600 mt-1">
                  {completionRate}%
                </span>
              </div>
            </div>

            <div className="px-6 border-b border-slate-100 bg-white flex items-center justify-between overflow-x-auto">
              <div className="flex gap-2 py-2 shrink-0">
                {tabOptions.map((opt) => {
                  const isActive = activeTab === opt.value;
                  const count =
                    opt.value === "ALL"
                      ? orders.length
                      : orders.filter((o) => o.status === opt.value).length;

                  return (
                    <button
                      key={opt.value}
                      onClick={() => setActiveTab(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      {opt.label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50/30">
              {ordersLoading ? (
                <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600 mx-auto mb-2"></div>
                  Đang tải danh sách đơn hàng...
                </div>
              ) : ordersError ? (
                <div className="p-8 text-center text-red-500 text-xs font-medium">
                  Có lỗi xảy ra khi tải đơn hàng của khách hàng này.
                </div>
              ) : filteredOrders.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs italic">
                  Không tìm thấy đơn hàng nào.
                </div>
              ) : (
                <div className="p-6">
                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500">
                        <tr>
                          <th className="p-4">Mã Đơn</th>
                          <th className="p-4">Ngày Tạo</th>
                          <th className="p-4">Trạng Thái</th>
                          <th className="p-4">Tổng Tiền</th>
                          <th className="p-4 text-right">Thao Tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                        {filteredOrders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-slate-50/50 transition-colors"
                          >
                            <td className="p-4 font-bold text-slate-800">
                              #{order.orderCode}
                            </td>
                            <td className="p-4 text-slate-400">
                              {formatDate(order.createdAt)}
                            </td>
                            <td className="p-4">
                              <OrderStatusBadge status={order.status} />
                            </td>
                            <td className="p-4 font-bold text-slate-800">
                              {formatCurrency(Number(order.totalAmount))}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => setSelectedOrderId(order.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 font-bold text-slate-600 transition-all duration-150 cursor-pointer shadow-2xs"
                              >
                                Xem chi tiết
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <OrderDrawer
        orderId={selectedOrderId}
        onClose={closeOrderDrawer}
        onStatusUpdated={handleOrderStatusUpdated}
      />

      {/* Admin Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-800">Chỉnh sửa thông tin người dùng</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{selectedUser?.email}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                ✕
              </button>
            </div>

            {editError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                ⚠️ {editError}
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  value={editFormData.fullName}
                  onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  value={editFormData.phone}
                  onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Địa chỉ</label>
                <textarea
                  rows="2"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition-colors disabled:opacity-60"
                >
                  {editLoading && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                  {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAccessModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md space-y-5 rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-800">
                  Phân quyền và trạng thái
                </h3>
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {selectedUser?.email}
                </p>
              </div>
              <button
                onClick={() => setIsAccessModalOpen(false)}
                className="rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            {accessError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-700">
                ⚠️ {accessError}
              </div>
            )}

            {selectedUser?.id === currentUser?.id && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold leading-relaxed text-amber-700">
                Bạn không thể tự khóa tài khoản hoặc tự hạ quyền quản trị.
              </div>
            )}

            <form onSubmit={handleSaveAccess} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">
                  Vai trò
                </label>
                <select
                  value={accessFormData.role}
                  disabled={selectedUser?.id === currentUser?.id}
                  onChange={(event) =>
                    setAccessFormData((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold focus:border-indigo-500 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="customer">Customer (Khách hàng)</option>
                  <option value="admin">Admin (Quản trị viên)</option>
                </select>
              </div>

              <label className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
                <span>
                  <span className="block text-xs font-bold text-slate-700">
                    Tài khoản hoạt động
                  </span>
                  <span className="mt-1 block text-[10px] text-slate-400">
                    Tắt sẽ đăng xuất tài khoản khỏi tất cả thiết bị.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={accessFormData.isActive}
                  disabled={selectedUser?.id === currentUser?.id}
                  onChange={(event) =>
                    setAccessFormData((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                  className="h-5 w-5 accent-indigo-600 disabled:cursor-not-allowed"
                />
              </label>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAccessModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition-colors hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={
                    accessLoading || selectedUser?.id === currentUser?.id
                  }
                  className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
                >
                  {accessLoading ? "Đang lưu..." : "Lưu phân quyền"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
