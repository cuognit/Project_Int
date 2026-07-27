import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { formatCurrency } from "../../utils/formatCurrency.js";

function QuantityInput({ value, stock, onChange }) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(String(value)), [value]);

  return (
    <input
      type="number"
      min="1"
      max={stock}
      value={draft}
      onChange={(event) => {
        const nextDraft = event.target.value;
        setDraft(nextDraft);
        const quantity = Number(nextDraft);
        if (Number.isInteger(quantity) && quantity >= 1 && quantity <= stock) {
          onChange(quantity);
        }
      }}
      onBlur={() => setDraft(String(value))}
      className="w-12 appearance-none border-x border-slate-200 bg-white px-1 py-1 text-center text-xs font-bold text-slate-800 outline-none focus:bg-orange-50 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      aria-label="Số lượng sản phẩm"
    />
  );
}

export default function CartPage() {
  const {
    cart,
    updateCartQuantity,
    setCartQuantity,
    removeFromCart,
    cartTotal,
    cartLoading,
    cartError,
    cartSyncing,
    flushCartChanges,
  } = useAuth();
  const navigate = useNavigate();
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    await flushCartChanges();
    navigate("/checkout");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">Giỏ Hàng Shopee</h1>
        <p className="mt-1 text-xs text-slate-400">
          Kiểm tra sản phẩm trước khi thanh toán
        </p>
        <p
          className={`mt-1 text-[10px] font-semibold ${
            cartSyncing ? "text-amber-600" : "text-emerald-600"
          }`}
        >
          {cartSyncing ? "Đang lưu thay đổi..." : "Đã đồng bộ"}
        </p>
      </div>

      {cartError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
          {cartError}
        </div>
      )}

      {cartLoading ? (
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm font-semibold text-slate-400">
          <div className="mx-auto mb-3 h-7 w-7 animate-spin rounded-full border-2 border-orange-200 border-t-[#ee4d2d]" />
          Đang tải giỏ hàng...
        </div>
      ) : cart.length === 0 ? (
        <div className="space-y-4 rounded-3xl border border-orange-100 bg-white p-12 text-center shadow-xs">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-2xl text-[#ee4d2d]">
            🛒
          </div>
          <h3 className="text-lg font-bold text-slate-800">Giỏ hàng đang trống</h3>
          <p className="text-xs text-slate-400">
            Bạn chưa có sản phẩm nào trong giỏ hàng.
          </p>
          <Link
            to="/"
            className="inline-block rounded-xl bg-[#ee4d2d] px-6 py-3 text-xs font-extrabold text-white shadow-md shadow-orange-100"
          >
            Tiếp tục mua sắm
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            {cart.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="relative flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs transition-colors hover:border-orange-300"
              >
                <Link
                  to={`/products/${product.id}`}
                  className="absolute inset-0 rounded-2xl"
                  aria-label={`Xem chi tiết ${product.name}`}
                />
                <img
                  src={product.imageUrl || "https://picsum.photos/100/100"}
                  alt={product.name}
                  className="pointer-events-none h-16 w-16 shrink-0 rounded-xl bg-slate-100 object-cover"
                />
                <div className="pointer-events-none min-w-0 flex-1">
                  <h4 className="truncate text-xs font-bold text-slate-800">
                    {product.name}
                  </h4>
                  <span className="mt-0.5 block text-[10px] text-slate-400">
                    SKU: {product.sku}
                  </span>
                  <span className="mt-1 block text-xs font-black text-[#ee4d2d]">
                    {formatCurrency(Number(product.price))}
                  </span>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                  <div className="flex items-center overflow-hidden rounded-xl border border-slate-200">
                    <button
                      onClick={() => updateCartQuantity(product.id, -1)}
                      className="bg-slate-50 px-2.5 py-1 text-xs font-bold hover:bg-slate-100"
                    >
                      −
                    </button>
                    <QuantityInput
                      value={quantity}
                      stock={product.stock}
                      onChange={(nextQuantity) =>
                        setCartQuantity(product.id, nextQuantity)
                      }
                    />
                    <button
                      onClick={() => updateCartQuantity(product.id, 1)}
                      className="bg-slate-50 px-2.5 py-1 text-xs font-bold hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                  <button
                    onClick={() => removeFromCart(product.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600"
                    title="Xóa sản phẩm"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="h-fit space-y-4 rounded-3xl border border-orange-100 bg-white p-6 shadow-xs">
            <h3 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-800">
              Tóm tắt đơn hàng
            </h3>
            <div className="flex justify-between text-xs text-slate-500">
              <span>Sản phẩm:</span>
              <span className="font-bold text-slate-800">{cart.length}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-slate-100 pt-3">
              <span className="text-xs font-bold text-slate-800">Tổng thanh toán:</span>
              <span className="text-xl font-black text-[#ee4d2d]">
                {formatCurrency(cartTotal)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full rounded-xl bg-[#ee4d2d] py-3.5 text-xs font-extrabold text-white shadow-md shadow-orange-200 hover:bg-[#d73211] disabled:opacity-60"
            >
              {checkoutLoading ? "Đang đồng bộ..." : "Mua Hàng Ngay →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
