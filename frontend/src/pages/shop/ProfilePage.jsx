import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { getProfile, updateProfile, changePassword } from "../../api/userApi.js";

export default function ProfilePage() {
  const { user, updateUserProfile } = useAuth();

  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });

  // Password Form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }

    // Fetch fresh profile from API
    getProfile()
      .then((data) => {
        setFullName(data.fullName || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
        updateUserProfile(data);
      })
      .catch((err) => console.error("Error fetching profile:", err));
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: "", text: "" });

    if (!fullName.trim()) {
      setProfileMessage({ type: "error", text: "Họ và tên không được để trống" });
      return;
    }

    setProfileLoading(true);
    try {
      const res = await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      });
      setProfileMessage({ type: "success", text: res.message || "Cập nhật hồ sơ thành công!" });
      updateUserProfile(res.data);
    } catch (err) {
      setProfileMessage({
        type: "error",
        text: err?.response?.data?.message || err?.message || "Cập nhật thất bại. Vui lòng thử lại.",
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: "", text: "" });

    if (!currentPassword) {
      setPasswordMessage({ type: "error", text: "Vui lòng nhập mật khẩu hiện tại" });
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "Mật khẩu mới và xác nhận mật khẩu không trùng khớp" });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await changePassword({ currentPassword, newPassword });
      setPasswordMessage({ type: "success", text: res.message || "Đổi mật khẩu thành công!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMessage({
        type: "error",
        text: err?.response?.data?.message || err?.message || "Đổi mật khẩu thất bại. Vui lòng thử lại.",
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 select-none">
      {/* Profile Banner Card */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-[#ee4d2d] to-[#ff7337] px-6 py-8 text-white">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl font-black text-[#ee4d2d] shadow-lg">
              {fullName ? fullName.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <h1 className="text-2xl font-black">{fullName || "Người dùng"}</h1>
              <p className="mt-1 text-xs text-orange-100">{email}</p>
              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white">
                <span>{user?.role === "admin" ? "👑 Quản trị viên" : "🛒 Khách hàng thân thiết"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "profile"
                ? "border-[#ee4d2d] text-[#ee4d2d]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Hồ sơ cá nhân
          </button>
          <button
            onClick={() => setActiveTab("password")}
            className={`flex items-center gap-2 border-b-2 px-4 py-3.5 text-xs font-bold transition-all cursor-pointer ${
              activeTab === "password"
                ? "border-[#ee4d2d] text-[#ee4d2d]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Đổi mật khẩu
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8">
          {activeTab === "profile" ? (
            <form onSubmit={handleUpdateProfile} className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-base font-black text-slate-800">Thông tin cá nhân</h2>
                <p className="text-xs text-slate-400 mt-0.5">Quản lý và cập nhật thông tin tài khoản của bạn.</p>
              </div>

              {profileMessage.text && (
                <div
                  className={`rounded-2xl border p-4 text-xs font-bold flex items-center gap-2.5 ${
                    profileMessage.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  <span>{profileMessage.type === "success" ? "✓" : "⚠️"}</span>
                  <span>{profileMessage.text}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Họ và tên <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nhập họ và tên..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold outline-none transition focus:border-[#ee4d2d] focus:bg-white"
                    required
                  />
                </div>

                {/* Email (Readonly) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Địa chỉ Email <span className="text-slate-400 font-normal">(Cố định)</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-xs font-semibold text-slate-500 cursor-not-allowed outline-none"
                  />
                  <p className="mt-1 text-[10px] text-slate-400">Email dùng để đăng nhập và không thể thay đổi vì lý do bảo mật.</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Ví dụ: 0912345678"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold outline-none transition focus:border-[#ee4d2d] focus:bg-white"
                  />
                </div>

                {/* Address */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Địa chỉ nhận hàng mặc định
                  </label>
                  <textarea
                    rows="3"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Nhập số nhà, tên đường, phường/xã, quận/huyện..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold outline-none transition focus:border-[#ee4d2d] focus:bg-white resize-none"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ee4d2d] hover:bg-[#d83c1d] text-white px-6 py-2.5 text-xs font-bold cursor-pointer disabled:opacity-60 transition-all shadow-md"
                >
                  {profileLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                  {profileLoading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleChangePassword} className="space-y-6 max-w-xl">
              <div>
                <h2 className="text-base font-black text-slate-800">Đổi mật khẩu</h2>
                <p className="text-xs text-slate-400 mt-0.5">Để bảo vệ tài khoản, vui lòng không chia sẻ mật khẩu cho người khác.</p>
              </div>

              {passwordMessage.text && (
                <div
                  className={`rounded-2xl border p-4 text-xs font-bold flex items-center gap-2.5 ${
                    passwordMessage.type === "success"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-rose-200 bg-rose-50 text-rose-800"
                  }`}
                >
                  <span>{passwordMessage.type === "success" ? "✓" : "⚠️"}</span>
                  <span>{passwordMessage.text}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mật khẩu hiện tại <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Nhập mật khẩu đang sử dụng..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold outline-none transition focus:border-[#ee4d2d] focus:bg-white"
                    required
                  />
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold outline-none transition focus:border-[#ee4d2d] focus:bg-white"
                    required
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Xác nhận mật khẩu mới <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold outline-none transition focus:border-[#ee4d2d] focus:bg-white"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#ee4d2d] hover:bg-[#d83c1d] text-white px-6 py-2.5 text-xs font-bold cursor-pointer disabled:opacity-60 transition-all shadow-md"
                >
                  {passwordLoading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />}
                  {passwordLoading ? "Đang cập nhật..." : "Đổi mật khẩu"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
