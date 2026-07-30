import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registerApi } from "../../api/authApi.js";

const initialForm = {
  fullName: "",
  email: "",
  password: "",
  phone: "",
  address: "",
};

// Thu thập, xác thực và gửi thông tin đăng ký tài khoản mới.
export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: undefined }));
    setError("");
  };

  // Gửi biểu mẫu hợp lệ và chuyển người dùng tới trang đăng nhập.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setFieldErrors({});

    try {
      const user = await registerApi(form);
      navigate("/login", {
        replace: true,
        state: {
          registrationSuccess: true,
          email: user.email,
        },
      });
    } catch (apiError) {
      setFieldErrors(apiError?.errors || {});
      setError(apiError?.message || "Không thể đăng ký tài khoản. Vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-xl border bg-slate-50 px-4 py-2.5 outline-none transition-all focus:bg-white ${
      fieldErrors[field]
        ? "border-rose-400 focus:border-rose-500"
        : "border-slate-200 focus:border-[#ee4d2d]"
    }`;

  const FieldError = ({ field }) =>
    fieldErrors[field] ? (
      <p className="mt-1 text-[11px] font-semibold text-rose-600">
        {fieldErrors[field]}
      </p>
    ) : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-300 to-[#e36c54] p-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/30 bg-white p-8 shadow-2xl">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ee4d2d] text-3xl font-black text-white shadow-lg shadow-orange-200">
            S
          </div>
          <h2 className="text-2xl font-black text-slate-800">Đăng Ký ShopeeMart</h2>
          <p className="text-xs text-slate-400">
            Tạo tài khoản người mua để nhận ưu đãi Voucher Freeship 0Đ
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs" noValidate>
          <div>
            <label htmlFor="fullName" className="mb-1 block font-bold text-slate-700">
              Họ và tên *
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              value={form.fullName}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
              className={inputClass("fullName")}
              disabled={submitting}
            />
            <FieldError field="fullName" />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block font-bold text-slate-700">
              Email *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              placeholder="email@example.com"
              className={inputClass("email")}
              disabled={submitting}
            />
            <FieldError field="email" />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block font-bold text-slate-700">
              Mật khẩu *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              placeholder="Tối thiểu 8 ký tự, gồm chữ và số"
              className={inputClass("password")}
              disabled={submitting}
            />
            <FieldError field="password" />
          </div>

          <div>
            <label htmlFor="phone" className="mb-1 block font-bold text-slate-700">
              Số điện thoại
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              value={form.phone}
              onChange={handleChange}
              placeholder="0988xxxxxx"
              className={inputClass("phone")}
              disabled={submitting}
            />
            <FieldError field="phone" />
          </div>

          <div>
            <label htmlFor="address" className="mb-1 block font-bold text-slate-700">
              Địa chỉ nhận hàng
            </label>
            <input
              id="address"
              name="address"
              type="text"
              autoComplete="street-address"
              value={form.address}
              onChange={handleChange}
              placeholder="Số nhà, Đường, Quận/Huyện, TP"
              className={inputClass("address")}
              disabled={submitting}
            />
            <FieldError field="address" />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 w-full rounded-xl bg-[#ee4d2d] py-3.5 text-xs font-black text-white shadow-md shadow-orange-200 transition-all hover:bg-[#d73211] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "ĐANG ĐĂNG KÝ..." : "ĐĂNG KÝ SHOPEEMART"}
          </button>
        </form>

        <div className="border-t border-slate-100 pt-2 text-center text-xs text-slate-500">
          Đã có tài khoản?{" "}
          <Link to="/login" className="font-bold text-[#ee4d2d] hover:underline">
            Đăng nhập ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
