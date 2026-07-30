import { OAuth2Client } from "google-auth-library";

const GOOGLE_NAME_MAX_LENGTH = 100;
const TRANSIENT_GOOGLE_ERROR_CODES = new Set([
  "ECONNABORTED",
  "ECONNRESET",
  "ENETUNREACH",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ETIMEDOUT",
]);
const googleClient = new OAuth2Client();

// Chuẩn hóa tên Google và dùng email làm giá trị dự phòng khi cần.
export const normalizeGoogleFullName = (name, email) => {
  const fallback = email.split("@")[0];
  const normalized = typeof name === "string" ? name.trim() : "";
  return (normalized || fallback).slice(0, GOOGLE_NAME_MAX_LENGTH);
};

// Nhận diện lỗi tạm thời từ dịch vụ hoặc kết nối Google.
export const isGoogleServiceUnavailableError = (error) => {
  if (!error) return false;
  if (TRANSIENT_GOOGLE_ERROR_CODES.has(error.code)) return true;
  if (Number(error.response?.status) >= 500) return true;
  return isGoogleServiceUnavailableError(error.cause);
};

// Xác minh Google ID token và trả về hồ sơ đã được kiểm chứng.
export const verifyGoogleToken = async (credential, verifier = googleClient) => {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    console.error("Cấu hình GOOGLE_CLIENT_ID bị thiếu trên server");
    const error = new Error("Dịch vụ đăng nhập Google chưa được cấu hình");
    error.statusCode = 503;
    throw error;
  }

  let ticket;
  try {
    ticket = await verifier.verifyIdToken({
      idToken: credential,
      audience: googleClientId,
    });
  } catch (err) {
    console.warn("Xác minh Google ID Token thất bại:", err.message);
    const unavailable = isGoogleServiceUnavailableError(err);
    const error = new Error(
      unavailable
        ? "Dịch vụ đăng nhập Google tạm thời không khả dụng"
        : "Mã xác thực Google không hợp lệ hoặc đã hết hạn",
    );
    error.statusCode = unavailable ? 503 : 401;
    throw error;
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email || payload.email_verified !== true) {
    const error = new Error("Tài khoản Google chưa được xác minh email hoặc không hợp lệ");
    error.statusCode = 401;
    throw error;
  }

  return payload;
};
