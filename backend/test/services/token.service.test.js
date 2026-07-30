import assert from "node:assert/strict";
import test from "node:test";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  REFRESH_TOKEN_TTL_SECONDS,
  createAccessToken,
  createAuthTokens,
  hashRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../../src/services/token.service.js";

const setupTestEnv = () => {
  const oldAccess = process.env.JWT_ACCESS_SECRET;
  const oldRefresh = process.env.JWT_REFRESH_SECRET;
  process.env.JWT_ACCESS_SECRET = "12345678901234567890123456789012_ACCESS";
  process.env.JWT_REFRESH_SECRET = "12345678901234567890123456789012_REFRESH";
  return () => {
    process.env.JWT_ACCESS_SECRET = oldAccess;
    process.env.JWT_REFRESH_SECRET = oldRefresh;
  };
};

test("token.service - Kiểm tra các hằng số thời gian sống của token", () => {
  assert.equal(ACCESS_TOKEN_TTL_SECONDS, 15 * 60);
  assert.equal(REFRESH_TOKEN_TTL_SECONDS, 7 * 24 * 60 * 60);
});

test("hashRefreshToken - Đảm bảo băm SHA256 tạo chuỗi hex nhất quán", () => {
  const hash1 = hashRefreshToken("sample-token");
  const hash2 = hashRefreshToken("sample-token");
  assert.equal(hash1, hash2);
  assert.equal(typeof hash1, "string");
  assert.equal(hash1.length, 64);
});

test("createAccessToken & verifyAccessToken - Tạo và giải mã Access Token chính xác", () => {
  const restoreEnv = setupTestEnv();
  try {
    const mockUser = { id: 101, role: "customer" };
    const token = createAccessToken(mockUser);
    assert.equal(typeof token, "string");

    const decoded = verifyAccessToken(token);
    assert.equal(decoded.sub, "101");
    assert.equal(decoded.role, "customer");
    assert.equal(decoded.type, "access");
  } finally {
    restoreEnv();
  }
});

test("createAuthTokens - Tạo cặp Access & Refresh Token hợp lệ", () => {
  const restoreEnv = setupTestEnv();
  try {
    const mockUser = { id: 202, role: "admin" };
    const result = createAuthTokens(mockUser);

    assert.ok(result.accessToken);
    assert.ok(result.refreshToken);
    assert.ok(result.refreshId);
    assert.ok(result.refreshExpiresAt instanceof Date);

    const decodedRefresh = verifyRefreshToken(result.refreshToken);
    assert.equal(decodedRefresh.sub, "202");
    assert.equal(decodedRefresh.type, "refresh");
    assert.equal(decodedRefresh.jti, result.refreshId);
  } finally {
    restoreEnv();
  }
});

test("token.service - Báo lỗi 500 khi secret JWT không được cấu hình hoặc quá ngắn", () => {
  const restoreEnv = setupTestEnv();
  delete process.env.JWT_ACCESS_SECRET;
  try {
    assert.throws(
      () => createAccessToken({ id: 1, role: "customer" }),
      (err) => err.statusCode === 500 && err.message.includes("JWT_ACCESS_SECRET"),
    );
  } finally {
    restoreEnv();
  }
});
