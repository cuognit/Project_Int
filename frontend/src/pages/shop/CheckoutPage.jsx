import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createOrder } from "../../api/orderApi.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";

const fieldClass = (hasError) =>
  `w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-[#ee4d2d] ${
    hasError ? "border-rose-400" : "border-slate-200"
  }`;

export default function CheckoutPage() {
  const {
    user,
    cart,
    cartTotal,
    clearCart,
    flushCartChanges,
    cartSyncing,
  } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    shippingName: user?.fullName || "",
    shippingPhone: user?.phone || "",
    shippingAddress: user?.address || "",
    note: "",
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);
  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  };

  const validate = () => {
    const next = {};
    if (form.shippingName.trim().length < 2) next.shippingName = "Vui lòng nhập họ tên người nhận.";
    if (!/^(?:\+84|0)\d{9,10}$/.test(form.shippingPhone.trim())) {
      next.shippingPhone = "Số điện thoại không hợp lệ.";
    }
    if (form.shippingAddress.trim().length < 5) {
      next.shippingAddress = "Vui lòng nhập địa chỉ giao hàng chi tiết.";
    }
    if (form.note.trim().length > 1000) next.note = "Ghi chú tối đa 1000 ký tự.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      await flushCartChanges();
      const order = await createOrder({
        shippingName: form.shippingName.trim(),
        shippingPhone: form.shippingPhone.trim(),
        shippingAddress: form.shippingAddress.trim(),
        note: form.note.trim(),
      });
      clearCart();
      navigate(`/my-orders/${order.id}`, {
        replace: true,
        state: { orderSuccess: true },
      });
    } catch (error) {
      if (error?.errors) setErrors(error.errors);
      setSubmitError(error?.message || "Không thể tạo đơn hàng. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!cart.length) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-12 text-center">
        <div className="text-4xl">🛒</div>
        <h3 className="text-lg font-bold text-slate-800">Không có sản phẩm để thanh toán</h3>
        <Link to="/cart" className="inline-block rounded-xl bg-[#ee4d2d] px-5 py-2.5 text-xs font-bold text-white">
          Quay lại giỏ hàng
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-6xl space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[11px] font-bold text-slate-400">
          <Link to="/cart" className="hover:text-[#ee4d2d]">Giỏ hàng</Link>
          <span>›</span>
          <span className="text-[#ee4d2d]">Thanh toán</span>
          <span>›</span>
          <span>Hoàn tất</span>
        </div>
        <h1 className="text-2xl font-black text-slate-800">Xác nhận đơn hàng</h1>
        <p className="mt-1 text-xs text-slate-400">Kiểm tra thông tin nhận hàng và sản phẩm trước khi đặt hàng.</p>
      </div>

      {submitError && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700">
          {submitError}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-black text-slate-800">📍 Thông tin nhận hàng</h2>
                <p className="mt-1 text-[11px] text-slate-400">Thông tin này được lưu riêng cho đơn hàng.</p>
              </div>
              <span className="rounded-full bg-orange-50 px-3 py-1 text-[10px] font-bold text-[#ee4d2d]">Bắt buộc</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 text-xs font-bold text-slate-700">
                <span>Họ tên người nhận *</span>
                <input
                  value={form.shippingName}
                  onChange={(e) => updateField("shippingName", e.target.value)}
                  maxLength={100}
                  className={fieldClass(errors.shippingName)}
                />
                {errors.shippingName && <span className="block text-[11px] text-rose-600">{errors.shippingName}</span>}
              </label>
              <label className="space-y-1.5 text-xs font-bold text-slate-700">
                <span>Số điện thoại *</span>
                <input
                  type="tel"
                  value={form.shippingPhone}
                  onChange={(e) => updateField("shippingPhone", e.target.value)}
                  maxLength={20}
                  className={fieldClass(errors.shippingPhone)}
                />
                {errors.shippingPhone && <span className="block text-[11px] text-rose-600">{errors.shippingPhone}</span>}
              </label>
            </div>

            <label className="mt-4 block space-y-1.5 text-xs font-bold text-slate-700">
              <span>Địa chỉ giao hàng *</span>
              <textarea
                rows={3}
                value={form.shippingAddress}
                onChange={(e) => updateField("shippingAddress", e.target.value)}
                maxLength={255}
                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành phố"
                className={`${fieldClass(errors.shippingAddress)} resize-none`}
              />
              {errors.shippingAddress && <span className="block text-[11px] text-rose-600">{errors.shippingAddress}</span>}
            </label>

            <label className="mt-4 block space-y-1.5 text-xs font-bold text-slate-700">
              <span>Ghi chú cho người giao hàng</span>
              <textarea
                rows={3}
                value={form.note}
                onChange={(e) => updateField("note", e.target.value)}
                maxLength={1000}
                placeholder="Ví dụ: Gọi trước khi giao..."
                className={`${fieldClass(errors.note)} resize-none`}
              />
              <span className="block text-right text-[10px] font-normal text-slate-400">{form.note.length}/1000</span>
            </label>
          </section>

          <section className="overflow-hidden rounded-3xl border border-orange-100 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-base font-black text-slate-800">Sản phẩm đặt mua</h2>
                <p className="mt-1 text-[11px] text-slate-400">{totalQuantity} sản phẩm trong {cart.length} mặt hàng</p>
              </div>
              <Link to="/cart" className="text-xs font-bold text-[#ee4d2d] hover:underline">Chỉnh sửa</Link>
            </div>
            <div className="divide-y divide-slate-100">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="grid grid-cols-[1fr_auto] items-center gap-4 p-5 sm:grid-cols-[1fr_110px_110px_120px]">
                  <Link to={`/products/${product.id}`} className="flex min-w-0 items-center gap-3">
                    <img src={product.imageUrl || "https://picsum.photos/80/80"} alt={product.name} className="h-14 w-14 shrink-0 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-slate-800 hover:text-[#ee4d2d]">{product.name}</p>
                      <p className="mt-1 text-[10px] text-slate-400">SKU: {product.sku}</p>
                    </div>
                  </Link>
                  <span className="hidden text-right text-xs text-slate-500 sm:block">{formatCurrency(Number(product.price))}</span>
                  <span className="hidden text-center text-xs font-semibold text-slate-600 sm:block">x{quantity}</span>
                  <div className="text-right">
                    <span className="block text-xs font-black text-slate-800">{formatCurrency(Number(product.price) * quantity)}</span>
                    <span className="text-[10px] text-slate-400 sm:hidden">x{quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm">
            <h2 className="border-b border-slate-100 pb-4 text-sm font-black text-slate-800">Phương thức thanh toán</h2>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border-2 border-[#ee4d2d] bg-orange-50/50 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">💵</div>
              <div>
                <p className="text-xs font-black text-slate-800">Thanh toán khi nhận hàng</p>
                <p className="mt-0.5 text-[10px] text-slate-500">COD · Thanh toán cho người giao hàng</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-orange-100 bg-white p-6 shadow-sm lg:sticky lg:top-24">
            <h2 className="border-b border-slate-100 pb-4 text-sm font-black text-slate-800">Chi tiết thanh toán</h2>
            <div className="space-y-3 py-4 text-xs">
              <div className="flex justify-between text-slate-500"><span>Tạm tính ({totalQuantity} sản phẩm)</span><span className="font-semibold text-slate-700">{formatCurrency(cartTotal)}</span></div>
              <div className="flex justify-between text-slate-500"><span>Phí vận chuyển</span><span className="font-bold text-emerald-600">Miễn phí</span></div>
            </div>
            <div className="flex items-end justify-between border-t border-slate-100 py-4">
              <span className="text-sm font-black text-slate-800">Tổng thanh toán</span>
              <span className="text-2xl font-black text-[#ee4d2d]">{formatCurrency(cartTotal)}</span>
            </div>
            <button
              type="submit"
              disabled={submitting || cartSyncing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#ee4d2d] py-4 text-sm font-black text-white shadow-lg shadow-orange-200 transition hover:bg-[#d73211] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Đang tạo đơn...</> : "Đặt hàng"}
            </button>
            <p className="mt-3 text-center text-[10px] leading-relaxed text-slate-400">Bằng việc đặt hàng, bạn đồng ý với điều khoản mua hàng của cửa hàng.</p>
          </section>
        </aside>
      </div>
    </form>
  );
}
