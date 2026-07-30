import { useState } from "react";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "../../api/categoryApi.js";

const errorMessage = (error) =>
  error?.message || error?.response?.data?.message || "Không thể cập nhật danh mục.";

// Quản lý thao tác thêm, sửa và xóa danh mục ngay trong modal.
export default function CategoryManagerModal({
  open,
  categories,
  onClose,
  onChanged,
}) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!open) return null;

  // Tạo danh mục mới và đồng bộ danh sách hiển thị.
  const addCategory = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await createCategory(newName);
      setNewName("");
      await onChanged();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  // Lưu tên mới cho danh mục đang chỉnh sửa.
  const saveCategory = async (categoryId) => {
    setSubmitting(true);
    setError("");
    try {
      await updateCategory(categoryId, editingName);
      setEditingId(null);
      await onChanged();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  // Xóa danh mục sau khi người dùng xác nhận.
  const removeCategory = async (category) => {
    if (!window.confirm(
      `Xóa danh mục "${category.name}"? Sản phẩm sẽ được chuyển sang “Chưa phân loại”.`,
    )) return;
    setSubmitting(true);
    setError("");
    try {
      await deleteCategory(category.id);
      await onChanged();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Quản lý danh mục</h2>
            <p className="text-xs text-slate-400">Tạo, đổi tên hoặc xóa danh mục sản phẩm.</p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">✕</button>
        </div>

        <div className="space-y-4 p-6">
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <form onSubmit={addCategory} className="flex gap-2">
            <input value={newName} onChange={(event) => setNewName(event.target.value)}
              required maxLength={100} placeholder="Tên danh mục mới"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500" />
            <button type="submit" disabled={submitting}
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              Thêm
            </button>
          </form>

          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center gap-2 p-3">
                {editingId === category.id ? (
                  <input value={editingName}
                    onChange={(event) => setEditingName(event.target.value)}
                    maxLength={100} autoFocus
                    className="min-w-0 flex-1 rounded-lg border border-indigo-300 px-2.5 py-2 text-sm outline-none" />
                ) : (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-slate-700">{category.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {category.activeProductCount} sản phẩm đang kinh doanh
                    </p>
                  </div>
                )}

                {category.isDefault ? (
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                    Mặc định
                  </span>
                ) : editingId === category.id ? (
                  <>
                    <button type="button" disabled={submitting}
                      onClick={() => saveCategory(category.id)}
                      className="text-xs font-bold text-emerald-600">Lưu</button>
                    <button type="button" onClick={() => setEditingId(null)}
                      className="text-xs font-bold text-slate-500">Hủy</button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => {
                      setEditingId(category.id);
                      setEditingName(category.name);
                    }} className="text-xs font-bold text-indigo-600">Sửa</button>
                    <button type="button" disabled={submitting}
                      onClick={() => removeCategory(category)}
                      className="text-xs font-bold text-red-600">Xóa</button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
