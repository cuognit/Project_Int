import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { googleLoginApi, loginApi } from "../../api/authApi.js";
import GoogleLoginButton from "../../components/auth/GoogleLoginButton.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

// Xử lý đăng nhập bằng mật khẩu hoặc tài khoản Google.
export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [email, setEmail] = useState(location.state?.email || "");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Xác thực biểu mẫu và khởi tạo phiên đăng nhập bằng email.
  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setErrors({});

    try {
      const data = await loginApi({ email, password });
      login(data.user, data.accessToken);
      navigate(data.user.role === "admin" ? "/admin" : from, { replace: true });
    } catch (apiError) {
      setErrors(apiError?.errors || {});
      setError(apiError?.message || "Không thể đăng nhập. Vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  // Đổi Google credential lấy phiên đăng nhập của ứng dụng.
  const handleGoogleSuccess = async (credential) => {
    setSubmitting(true);
    setError("");
    setErrors({});

    try {
      const data = await googleLoginApi(credential);
      login(data.user, data.accessToken);
      navigate(data.user.role === "admin" ? "/admin" : from, { replace: true });
    } catch (apiError) {
      setErrors(apiError?.errors || {});
      setError(apiError?.message || "Đăng nhập bằng Google thất bại. Vui lòng thử lại.");
      setSubmitting(false);
    }
  };

  const handleGoogleError = (errMsg) => {
    setError(errMsg || "Lỗi kết nối với dịch vụ đăng nhập Google.");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-orange-300 to-[#e36c54] p-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-white/30 bg-white p-8 shadow-2xl">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ee4d2d] text-3xl font-black text-white shadow-lg shadow-orange-200">
            S
          </div>
          <h2 className="text-2xl font-black text-slate-800">Đăng Nhập ShopeeMart</h2>
          <p className="text-xs text-slate-400">
            Chào mừng bạn quay lại với hệ thống mua sắm
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}
        {location.state?.registrationSuccess && !error && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
            Đăng ký tài khoản thành công. Vui lòng đăng nhập.
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs" noValidate>
          <div>
            <label htmlFor="email" className="mb-1 block font-bold text-slate-700">
              Email đăng nhập
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrors((current) => ({ ...current, email: undefined }));
              }}
              placeholder="email@example.com"
              disabled={submitting}
              className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-slate-800 outline-none transition-all focus:bg-white ${
                errors.email ? "border-rose-400" : "border-slate-200 focus:border-[#ee4d2d]"
              }`}
            />
            {errors.email && <p className="mt-1 text-rose-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block font-bold text-slate-700">
              Mật khẩu
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrors((current) => ({ ...current, password: undefined }));
              }}
              placeholder="••••••••"
              disabled={submitting}
              className={`w-full rounded-xl border bg-slate-50 px-4 py-3 text-slate-800 outline-none transition-all focus:bg-white ${
                errors.password ? "border-rose-400" : "border-slate-200 focus:border-[#ee4d2d]"
              }`}
            />
            {errors.password && <p className="mt-1 text-rose-600">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-xl bg-[#ee4d2d] py-3.5 text-xs font-black text-white shadow-md shadow-orange-200 transition-all hover:bg-[#d73211] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "ĐANG ĐĂNG NHẬP..." : "ĐĂNG NHẬP SHOPEE"}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-4">
          <div className="w-full border-t border-slate-200" />
          <span className="absolute bg-white px-3 text-xs font-semibold text-slate-400 uppercase">
            Hoặc
          </span>
        </div>

        <GoogleLoginButton
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
          disabled={submitting}
        />

        <div className="border-t border-slate-100 pt-2 text-center text-xs text-slate-500">
          Chưa có tài khoản?{" "}
          <Link to="/register" className="font-bold text-[#ee4d2d] hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
}
