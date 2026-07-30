import { createHash, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";

export const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const getSecret = (name) => {
  const value = process.env[name];
  if (!value || value.length < 32) {
    const error = new Error(`${name} phải được cấu hình với ít nhất 32 ký tự`);
    error.statusCode = 500;
    throw error;
  }
  return value;
};

// Băm refresh token trước khi lưu để tránh lưu token gốc.
export const hashRefreshToken = (token) =>
  createHash("sha256").update(token).digest("hex");

// Tạo access token ngắn hạn chứa thông tin định danh và phân quyền.
export const createAccessToken = (user) =>
  jwt.sign(
    { role: user.role, type: "access" },
    getSecret("JWT_ACCESS_SECRET"),
    {
      algorithm: "HS256",
      subject: String(user.id),
      jwtid: randomUUID(),
      expiresIn: ACCESS_TOKEN_TTL_SECONDS,
    },
  );

// Xác minh chữ ký và thời hạn của refresh token.
export const verifyRefreshToken = (token) =>
  jwt.verify(token, getSecret("JWT_REFRESH_SECRET"), {
    algorithms: ["HS256"],
  });

// Xác minh chữ ký và thời hạn của access token.
export const verifyAccessToken = (token) =>
  jwt.verify(token, getSecret("JWT_ACCESS_SECRET"), {
    algorithms: ["HS256"],
  });

// Phát hành đồng thời access token và refresh token cho người dùng.
export const createAuthTokens = (user) => {
  const userId = String(user.id);
  const refreshId = randomUUID();
  const accessToken = createAccessToken(user);
  const refreshToken = jwt.sign(
    { type: "refresh" },
    getSecret("JWT_REFRESH_SECRET"),
    {
      algorithm: "HS256",
      subject: userId,
      jwtid: refreshId,
      expiresIn: REFRESH_TOKEN_TTL_SECONDS,
    },
  );

  return {
    accessToken,
    refreshToken,
    refreshId,
    refreshExpiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
  };
};
