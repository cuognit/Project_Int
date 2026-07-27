import { useEffect, useState } from "react";

const localDateTime = (date) => {
  const value = new Date(date);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 16);
};

const emptyForm = () => ({
  code: "",
  name: "",
  description: "",
  discountType: "FIXED",
  discountValue: "",
  maxDiscountAmount: "",
  minOrderAmount: 0,
  scope: "ALL",
  categoryIds: [],
  audience: "ALL",
  userIds: [],
  startAt: localDateTime(new Date()),
  endAt: localDateTime(Date.now() + 30 * 24 * 60 * 60 * 1000),
  isActive: true,
  totalUsageLimit: "",
  perUserLimit: 1,
});

const initialForm = (voucher) => voucher ? {
  code: voucher.code,
  name: voucher.name,
  description: voucher.description || "",
  discountType: voucher.discountType,
  discountValue: String(voucher.discountValue),
  maxDiscountAmount: voucher.maxDiscountAmount ?? "",
  minOrderAmount: String(voucher.minOrderAmount),
  scope: voucher.scope,
  categoryIds: voucher.categories?.map((category) => category.id) || [],
  audience: voucher.audience,
  userIds: voucher.users?.map((user) => user.id) || [],
  startAt: localDateTime(voucher.startAt),
  endAt: localDateTime(voucher.endAt),
  isActive: voucher.isActive,
  totalUsageLimit: voucher.totalUsageLimit ?? "",
  perUserLimit: voucher.perUserLimit ?? "",
} : emptyForm();

export default function VoucherFormModal({
  open,
  voucher,
  categories,
  users,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState(emptyForm());
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(initialForm(voucher));
      setErrors({});
      setSubmitError("");
      setSubmitting(false);
    }
  }, [open, voucher]);

  if (!open) return null;

  const change = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const toggleId = (field, id) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(id)
        ? current[field].filter((value) => value !== id)
        : [...current[field], id],
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setErrors({});
    setSubmitError("");
    try {
      await onSubmit({
        ...form,
        discountValue: Number(form.discountValue),
        maxDiscountAmount: form.discountType === "FIXED" || form.maxDiscountAmount === ""
          ? null
          : Number(form.maxDiscountAmount),
        minOrderAmount: Number(form.minOrderAmount || 0),
        totalUsageLimit: form.totalUsageLimit === "" ? null : Number(form.totalUsageLimit),
        perUserLimit: form.perUserLimit === "" ? null : Number(form.perUserLimit),
        categoryIds: form.scope === "ALL" ? [] : form.categoryIds,
        userIds: form.audience === "ALL" ? [] : form.userIds,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
      });
    } catch (error) {
      setErrors(error?.errors || {});
      setSubmitError(error?.message || "Không thể lưu voucher.");
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-xl border px-3 py-2.5 text-sm outline-none ${
      errors[field] ? "border-red-400" : "border-slate-200 focus:border-indigo-500"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <div className="max-h-[94vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-800">
              {voucher ? "Chỉnh sửa voucher" : "Tạo voucher"}
            </h2>
            <p className="text-xs text-slate-400">Thiết lập giá trị, phạm vi và đối tượng sử dụng.</p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100">✕</button>
        </div>

        <form onSubmit={submit} className="space-y-6 p-6">
          {submitError && <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{submitError}</div>}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-bold text-slate-600">
              Mã voucher *
              <input name="code" value={form.code} onChange={change} required maxLength={50}
                className={`${inputClass("code")} uppercase`} />
              {errors.code && <span className="block text-red-600">{errors.code}</span>}
            </label>
            <label className="space-y-1.5 text-xs font-bold text-slate-600">
              Tên chương trình *
              <input name="name" value={form.name} onChange={change} required maxLength={150}
                className={inputClass("name")} />
              {errors.name && <span className="block text-red-600">{errors.name}</span>}
            </label>
          </div>

          <label className="block space-y-1.5 text-xs font-bold text-slate-600">
            Mô tả
            <textarea name="description" value={form.description} onChange={change}
              className={`${inputClass("description")} min-h-20`} />
          </label>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="space-y-1.5 text-xs font-bold text-slate-600">
              Loại giảm
              <select name="discountType" value={form.discountType} onChange={change}
                className={inputClass("discountType")}>
                <option value="FIXED">Số tiền cố định</option>
                <option value="PERCENTAGE">Phần trăm</option>
              </select>
            </label>
            <label className="space-y-1.5 text-xs font-bold text-slate-600">
              Giá trị giảm *
              <input name="discountValue" type="number" min="0.01" step="0.01"
                value={form.discountValue} onChange={change} required className={inputClass("discountValue")} />
              {errors.discountValue && <span className="block text-red-600">{errors.discountValue}</span>}
            </label>
            <label className="space-y-1.5 text-xs font-bold text-slate-600">
              Giảm tối đa
              <input name="maxDiscountAmount" type="number" min="0"
                disabled={form.discountType === "FIXED"} value={form.maxDiscountAmount}
                onChange={change} className={inputClass("maxDiscountAmount")} />
            </label>
            <label className="space-y-1.5 text-xs font-bold text-slate-600">
              Giá trị tối thiểu
              <input name="minOrderAmount" type="number" min="0"
                value={form.minOrderAmount} onChange={change} className={inputClass("minOrderAmount")} />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-bold text-slate-600">
              Bắt đầu
              <input name="startAt" type="datetime-local" value={form.startAt}
                onChange={change} required className={inputClass("startAt")} />
            </label>
            <label className="space-y-1.5 text-xs font-bold text-slate-600">
              Kết thúc
              <input name="endAt" type="datetime-local" value={form.endAt}
                onChange={change} required className={inputClass("endAt")} />
              {errors.endAt && <span className="block text-red-600">{errors.endAt}</span>}
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-xs font-bold text-slate-600">
              Tổng lượt sử dụng
              <input name="totalUsageLimit" type="number" min="1" placeholder="Để trống = không giới hạn"
                value={form.totalUsageLimit} onChange={change} className={inputClass("totalUsageLimit")} />
            </label>
            <label className="space-y-1.5 text-xs font-bold text-slate-600">
              Lượt tối đa mỗi user
              <input name="perUserLimit" type="number" min="1" placeholder="Để trống = không giới hạn"
                value={form.perUserLimit} onChange={change} className={inputClass("perUserLimit")} />
            </label>
          </div>

          <section className="rounded-2xl border border-slate-200 p-4">
            <label className="mb-3 block text-xs font-black text-slate-700">Phạm vi mặt hàng</label>
            <select name="scope" value={form.scope} onChange={change}
              className={`${inputClass("scope")} mb-3`}>
              <option value="ALL">Tất cả sản phẩm</option>
              <option value="CATEGORIES">Theo danh mục</option>
            </select>
            {form.scope === "CATEGORIES" && (
              <div className="grid max-h-44 gap-2 overflow-y-auto sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-xs">
                    <input type="checkbox" checked={form.categoryIds.includes(category.id)}
                      onChange={() => toggleId("categoryIds", category.id)} />
                    {category.name}
                  </label>
                ))}
              </div>
            )}
            {errors.categoryIds && <span className="mt-2 block text-xs text-red-600">{errors.categoryIds}</span>}
          </section>

          <section className="rounded-2xl border border-slate-200 p-4">
            <label className="mb-3 block text-xs font-black text-slate-700">Đối tượng sử dụng</label>
            <select name="audience" value={form.audience} onChange={change}
              className={`${inputClass("audience")} mb-3`}>
              <option value="ALL">Tất cả người dùng</option>
              <option value="TARGETED">Chỉ định người dùng</option>
            </select>
            {form.audience === "TARGETED" && (
              <div className="grid max-h-48 gap-2 overflow-y-auto sm:grid-cols-2">
                {users.map((user) => (
                  <label key={user.id} className="flex items-center gap-2 rounded-lg bg-slate-50 p-2 text-xs">
                    <input type="checkbox" checked={form.userIds.includes(user.id)}
                      onChange={() => toggleId("userIds", user.id)} />
                    <span className="min-w-0 truncate">{user.fullName} · {user.email}</span>
                  </label>
                ))}
              </div>
            )}
            {errors.userIds && <span className="mt-2 block text-xs text-red-600">{errors.userIds}</span>}
          </section>

          <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm font-bold text-slate-700">
            <input name="isActive" type="checkbox" checked={form.isActive} onChange={change} />
            Voucher đang hoạt động
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={submitting}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600">Hủy</button>
            <button type="submit" disabled={submitting}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {submitting ? "Đang lưu..." : "Lưu voucher"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
