import { useEffect, useState } from "react";

const EMPTY_FORM = {
  name: "", sku: "", description: "", price: "", stock: "",
  imageUrl: "", categoryId: "", isActive: true,
};

const initialForm = (product) => product ? {
  name: product.name,
  sku: product.sku,
  description: product.description || "",
  price: String(product.price),
  stock: String(product.stock),
  imageUrl: product.imageUrl || "",
  categoryId: String(product.categoryId || ""),
  isActive: product.isActive,
} : EMPTY_FORM;

export default function ProductFormModal({ product, categories, open, onClose, onSubmit }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialForm(product));
      setErrors({});
      setSubmitError("");
      setSubmitting(false);
      setImageFailed(false);
    }
  }, [open, product]);

  if (!open) return null;

  const changeField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setErrors({});
    try {
      await onSubmit({
        ...form,
        price: form.price === "" ? "" : Number(form.price),
        stock: form.stock === "" ? "" : Number(form.stock),
        categoryId: form.categoryId === "" ? "" : Number(form.categoryId),
      });
    } catch (error) {
      const response = error.response?.data || error;
      setErrors(response?.errors || {});
      setSubmitError(response?.message || "Không thể lưu sản phẩm. Vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition ${
      errors[field] ? "border-red-300 focus:border-red-500" : "border-slate-200 focus:border-indigo-500"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm"}
            </h2>
            <p className="mt-0.5 text-xs text-slate-400">Các trường có dấu * là bắt buộc</p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Đóng">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-6">
          {submitError && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_180px]">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                  Tên sản phẩm *
                  <input name="name" value={form.name} onChange={changeField} required
                    className={inputClass("name")} maxLength={150} autoFocus />
                  {errors.name && <span className="block text-red-600">{errors.name}</span>}
                </label>
                <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                  SKU *
                  <input name="sku" value={form.sku} onChange={changeField} required
                    className={inputClass("sku")} maxLength={50} />
                  {errors.sku && <span className="block text-red-600">{errors.sku}</span>}
                </label>
              </div>
              <label className="block space-y-1.5 text-xs font-semibold text-slate-600">
                Danh mục *
                <select name="categoryId" value={form.categoryId}
                  onChange={changeField} required className={inputClass("categoryId")}>
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                {errors.categoryId && <span className="block text-red-600">{errors.categoryId}</span>}
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                  Giá bán *
                  <input name="price" type="number" min="0" step="0.01" required
                    value={form.price} onChange={changeField} className={inputClass("price")} />
                  {errors.price && <span className="block text-red-600">{errors.price}</span>}
                </label>
                <label className="space-y-1.5 text-xs font-semibold text-slate-600">
                  Tồn kho *
                  <input name="stock" type="number" min="0" step="1" required
                    value={form.stock} onChange={changeField} className={inputClass("stock")} />
                  {errors.stock && <span className="block text-red-600">{errors.stock}</span>}
                </label>
              </div>
              <label className="block space-y-1.5 text-xs font-semibold text-slate-600">
                URL hình ảnh
                <input name="imageUrl" type="url" value={form.imageUrl}
                  onChange={(event) => { changeField(event); setImageFailed(false); }}
                  className={inputClass("imageUrl")} placeholder="https://example.com/image.jpg" />
                {errors.imageUrl && <span className="block text-red-600">{errors.imageUrl}</span>}
              </label>
              <label className="block space-y-1.5 text-xs font-semibold text-slate-600">
                Mô tả
                <textarea name="description" value={form.description} onChange={changeField}
                  className={`${inputClass("description")} min-h-24 resize-y`} />
              </label>
            </div>
            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-600">Xem trước ảnh</p>
              <div className="flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {form.imageUrl && !imageFailed ? (
                  <img src={form.imageUrl} alt="Xem trước sản phẩm"
                    className="h-full w-full object-cover" onError={() => setImageFailed(true)} />
                ) : <div className="px-4 text-center text-xs text-slate-400">Chưa có ảnh hợp lệ</div>}
              </div>
            </div>
          </div>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <input name="isActive" type="checkbox" checked={form.isActive}
              onChange={changeField} className="h-4 w-4 accent-indigo-600" />
            <span>
              <span className="block text-sm font-semibold text-slate-700">Đang kinh doanh</span>
              <span className="block text-xs text-slate-400">Sản phẩm đang hoạt động trong hệ thống</span>
            </span>
          </label>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
            <button type="button" onClick={onClose} disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
              Hủy
            </button>
            <button type="submit" disabled={submitting}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
              {submitting ? "Đang lưu..." : product ? "Lưu thay đổi" : "Thêm sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
