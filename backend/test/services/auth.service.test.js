import assert from "node:assert/strict";
import test from "node:test";
import { User, RefreshSession } from "../../src/models/index.js";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
} from "../../src/services/auth.service.js";
import { createAuthTokens } from "../../src/services/token.service.js";

const setupJwtEnv = () => {
  const oldAccess = process.env.JWT_ACCESS_SECRET;
  const oldRefresh = process.env.JWT_REFRESH_SECRET;
  process.env.JWT_ACCESS_SECRET = "12345678901234567890123456789012_ACCESS";
  process.env.JWT_REFRESH_SECRET = "12345678901234567890123456789012_REFRESH";
  return () => {
    process.env.JWT_ACCESS_SECRET = oldAccess;
    process.env.JWT_REFRESH_SECRET = oldRefresh;
  };
};

test("registerUser - Đăng ký tài khoản khách hàng thành công", async () => {
  const originalFindOne = User.findOne;
  const originalCreate = User.create;

  User.findOne = async () => null;
  User.create = async (data) => ({
    id: 1,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    role: data.role,
    isActive: true,
  });

  try {
    const user = await registerUser({
      fullName: "Nguyễn Văn A",
      email: "testa@example.com",
      password: "password123",
      phone: "0901234567",
      address: "Hà Nội",
    });

    assert.equal(user.id, 1);
    assert.equal(user.fullName, "Nguyễn Văn A");
    assert.equal(user.email, "testa@example.com");
    assert.equal(user.role, "customer");
  } finally {
    User.findOne = originalFindOne;
    User.create = originalCreate;
  }
});

test("registerUser - Báo lỗi 409 khi email đã tồn tại", async () => {
  const originalFindOne = User.findOne;
  User.findOne = async () => ({ id: 1, email: "existing@example.com" });

  try {
    await assert.rejects(
      registerUser({ fullName: "Test", email: "existing@example.com", password: "123" }),
      (err) => err.statusCode === 409,
    );
  } finally {
    User.findOne = originalFindOne;
  }
});

test("loginUser - Báo lỗi 401 khi email không tồn tại hoặc sai mật khẩu", async () => {
  const originalFindOne = User.findOne;
  User.findOne = async () => null;

  try {
    await assert.rejects(
      loginUser({ email: "notfound@example.com", password: "wrong" }),
      (err) => err.statusCode === 401,
    );
  } finally {
    User.findOne = originalFindOne;
  }
});

test("refreshAccessToken - Báo lỗi 401 khi không truyền refresh token", async () => {
  await assert.rejects(
    refreshAccessToken(null),
    (err) => err.statusCode === 401,
  );
});

test("refreshAccessToken - Cấp access token mới khi refresh token hợp lệ", async () => {
  const restoreEnv = setupJwtEnv();
  const originalFindOne = RefreshSession.findOne;

  const mockUser = {
    id: 10,
    fullName: "User Test",
    email: "user@test.com",
    phone: "0123456789",
    address: "HCM",
    role: "customer",
    isActive: true,
  };

  const tokens = createAuthTokens(mockUser);

  RefreshSession.findOne = async () => ({
    id: tokens.refreshId,
    userId: 10,
    user: mockUser,
  });

  try {
    const result = await refreshAccessToken(tokens.refreshToken);
    assert.ok(result.accessToken);
    assert.equal(result.user.id, 10);
  } finally {
    RefreshSession.findOne = originalFindOne;
    restoreEnv();
  }
});

test("logoutUser - Thu hồi phiên đăng nhập khi truyền refresh token", async () => {
  const restoreEnv = setupJwtEnv();
  const originalUpdate = RefreshSession.update;
  let updated = false;

  RefreshSession.update = async () => {
    updated = true;
    return [1];
  };

  try {
    await logoutUser("sample-token");
    assert.equal(updated, true);
  } finally {
    RefreshSession.update = originalUpdate;
    restoreEnv();
  }
});
