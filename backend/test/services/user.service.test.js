import assert from "node:assert/strict";
import test from "node:test";
import sequelize from "../../src/config/database.js";
import { RefreshSession, User } from "../../src/models/index.js";
import {
  getUserById,
  updateUserAccess,
  updateUserProfile,
} from "../../src/services/user.service.js";

test("getUserById - Loại bỏ trường password khi truy vấn thông tin người dùng", async () => {
  const origFindByPk = User.findByPk;
  User.findByPk = async (id, options) => {
    assert.deepEqual(options.attributes.exclude, ["password"]);
    return { id, fullName: "User 1" };
  };

  try {
    const user = await getUserById(1);
    assert.equal(user.id, 1);
  } finally {
    User.findByPk = origFindByPk;
  }
});

test("updateUserProfile - Báo lỗi 404 khi không tìm thấy người dùng", async () => {
  const origFindByPk = User.findByPk;
  User.findByPk = async () => null;

  try {
    await assert.rejects(
      updateUserProfile(999, { fullName: "Tên Mới" }),
      (err) => err.statusCode === 404,
    );
  } finally {
    User.findByPk = origFindByPk;
  }
});

test("updateUserAccess - Chặn Admin tự khóa tài khoản hoặc tự hạ quyền quản trị của chính mình", async () => {
  try {
    await assert.rejects(
      updateUserAccess(1, 1, { role: "customer", isActive: true }),
      (err) => err.statusCode === 409 && err.message.includes("tự khóa"),
    );
  } catch (err) {
    assert.equal(err.statusCode, 409);
  }
});
