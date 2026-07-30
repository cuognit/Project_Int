import { useEffect, useState } from "react";
import {
  createVoucher,
  getAdminVouchers,
  updateVoucher,
  updateVoucherStatus,
} from "../../api/voucherApi.js";
import { getCategories } from "../../api/categoryApi.js";
import { getUsers } from "../../api/userApi.js";
import VoucherFormModal from "../../components/vouchers/VoucherFormModal.jsx";
import Pagination from "../../components/common/Pagination.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";

// Quản lý danh sách, biểu mẫu và trạng thái hoạt động của voucher.
export default function VouchersPage() {
  const [vouchers, setVouchers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [notice, setNotice] = useState("");

  // Tải voucher theo bộ lọc và trang hiện tại.
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAdminVouchers({ search, status, page, limit: 20 });
      setVouchers(data.items);
      setPagination(data.pagination);
    } catch (requestError) {
      setError(requestError?.message || "Không thể tải voucher.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search, status, page]);
  useEffect(() => {
    Promise.all([getCategories(), getUsers()])
      .then(([categoryData, userData]) => {
        setCategories(categoryData);
        setUsers(userData);
      })
      .catch(() => setError("Không thể tải dữ liệu danh mục hoặc người dùng."));
  }, []);

  // Tạo mới hoặc cập nhật voucher đang chọn.
  const save = async (payload) => {
    if (editing) await updateVoucher(editing.id, payload);
    else await createVoucher(payload);
    setNotice(editing ? "Đã cập nhật voucher." : "Đã tạo voucher.");
    setFormOpen(false);
    setEditing(null);
    await load();
  };

  // Đảo trạng thái hoạt động của voucher và cập nhật danh sách.
  const toggleStatus = async (voucher) => {
    try {
      await updateVoucherStatus(voucher.id, !voucher.isActive);
      setNotice(voucher.isActive ? "Đã tắt voucher." : "Đã bật voucher.");
      await load();
    } catch (requestError) {
      setError(requestError?.message || "Không thể cập nhật trạng thái.");
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {notice && (
        <div className="fixed right-6 top-6 z-[60] rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-lg">
          {notice}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800">Quản lý voucher</h2>
          <p className="mt-1 text-sm text-slate-400">Tạo mã giảm giá theo toàn bộ đơn hoặc danh mục sản phẩm.</p>
        </div>
        <button type="button" onClick={() => { setEditing(null); setFormOpen(true); }}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700">
          + Tạo voucher
        </button>
      </div>

      {error && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row">
          <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Tìm mã hoặc tên voucher..."
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" />
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Đang bật</option>
            <option value="inactive">Đang tắt</option>
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-400">Đang tải voucher...</div>
        ) : !vouchers.length ? (
          <div className="p-12 text-center text-sm text-slate-400">Chưa có voucher phù hợp.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-400">
                <tr>
                  <th className="p-4">Voucher</th>
                  <th className="p-4">Mức giảm</th>
                  <th className="p-4">Phạm vi</th>
                  <th className="p-4">Đối tượng</th>
                  <th className="p-4">Lượt dùng</th>
                  <th className="p-4">Thời hạn</th>
                  <th className="p-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.map((voucher) => (
                  <tr key={voucher.id} className="text-xs text-slate-600">
                    <td className="p-4">
                      <p className="font-black text-indigo-700">{voucher.code}</p>
                      <p className="mt-1 font-bold text-slate-800">{voucher.name}</p>
                      <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        voucher.isActive ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}>{voucher.isActive ? "Đang bật" : "Đang tắt"}</span>
                    </td>
                    <td className="p-4 font-bold">
                      {voucher.discountType === "FIXED"
                        ? formatCurrency(Number(voucher.discountValue))
                        : `${Number(voucher.discountValue)}%`}
                      {voucher.maxDiscountAmount && (
                        <p className="mt-1 text-[10px] font-normal text-slate-400">
                          Tối đa {formatCurrency(Number(voucher.maxDiscountAmount))}
                        </p>
                      )}
                    </td>
                    <td className="max-w-56 p-4">
                      {voucher.scope === "ALL"
                        ? "Tất cả sản phẩm"
                        : voucher.categories.map((category) => category.name).join(", ")}
                    </td>
                    <td className="p-4">
                      {voucher.audience === "ALL" ? "Tất cả user" : `${voucher.users.length} user`}
                    </td>
                    <td className="p-4 font-bold">
                      {voucher.usageCount}/{voucher.totalUsageLimit ?? "∞"}
                      <p className="mt-1 text-[10px] font-normal text-slate-400">
                        Mỗi user: {voucher.perUserLimit ?? "∞"}
                      </p>
                    </td>
                    <td className="p-4 text-[11px]">
                      <p>{new Date(voucher.startAt).toLocaleString("vi-VN")}</p>
                      <p>→ {new Date(voucher.endAt).toLocaleString("vi-VN")}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => { setEditing(voucher); setFormOpen(true); }}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-indigo-600">Sửa</button>
                        <button type="button" onClick={() => toggleStatus(voucher)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 font-bold text-slate-600">
                          {voucher.isActive ? "Tắt" : "Bật"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-4">
          <Pagination currentPage={page} totalPages={pagination.totalPages}
            onPageChange={setPage} />
        </div>
      </div>

      <VoucherFormModal open={formOpen} voucher={editing} categories={categories} users={users}
        onClose={() => { setFormOpen(false); setEditing(null); }} onSubmit={save} />
    </div>
  );
}
