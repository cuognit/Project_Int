import assert from "node:assert/strict";
import test from "node:test";
import { formatValidationErrors, loginSchema, registerSchema } from "../../src/validators/auth.validator.js";
import { addCartItemSchema, productIdSchema } from "../../src/validators/cart.validator.js";

test("registerSchema - Xác thực thành công dữ liệu đăng ký người dùng hợp lệ", () => {
  const validData = {
    fullName: "Nguyễn Văn B",
    email: "TESTB@EXAMPLE.COM",
    password: "Password123",
    phone: "0912345678",
  };
  const result = registerSchema.safeParse(validData);
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.email, "testb@example.com");
  }
});

test("registerSchema - Từ chối email sai định dạng hoặc mật khẩu yếu", () => {
  const invalidData = {
    fullName: "N",
    email: "not-an-email",
    password: "123",
  };
  const result = registerSchema.safeParse(invalidData);
  assert.equal(result.success, false);
  if (!result.success) {
    const formatted = formatValidationErrors(result.error.issues);
    assert.ok(formatted.email);
    assert.ok(formatted.password);
  }
});

test("loginSchema - Xác thực email và mật khẩu khi đăng nhập", () => {
  const valid = loginSchema.safeParse({
    email: "USER@DOMAIN.COM",
    password: "anyPassword",
  });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.email, "user@domain.com");
  }
});

test("addCartItemSchema - Ép kiểu số và xác thực số lượng thêm vào giỏ hàng", () => {
  const valid = addCartItemSchema.safeParse({
    productId: "15",
    quantity: "2",
  });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.productId, 15);
    assert.equal(valid.data.quantity, 2);
  }

  const invalid = addCartItemSchema.safeParse({
    productId: "-1",
    quantity: "0",
  });
  assert.equal(invalid.success, false);
});
