import assert from "node:assert/strict";
import test from "node:test";
import { calculateDiscountAmount } from "../../src/services/voucher.service.js";

test("calculateDiscountAmount - Loại PERCENTAGE với giới hạn giảm tối đa maxDiscountAmount", () => {
  const voucher = {
    discountType: "PERCENTAGE",
    discountValue: 20, // 20%
    maxDiscountAmount: 50000,
  };

  // 400k * 20% = 80k, bị giới hạn tối đa 50k
  const discount = calculateDiscountAmount(voucher, 400000);
  assert.equal(discount, 50000);
});

test("calculateDiscountAmount - Loại PERCENTAGE không có giới hạn tối đa", () => {
  const voucher = {
    discountType: "PERCENTAGE",
    discountValue: 10, // 10%
    maxDiscountAmount: null,
  };

  // 200k * 10% = 20k
  const discount = calculateDiscountAmount(voucher, 200000);
  assert.equal(discount, 20000);
});

test("calculateDiscountAmount - Loại FIXED giảm số tiền cố định", () => {
  const voucher = {
    discountType: "FIXED",
    discountValue: 30000,
  };

  // 100k giảm 30k = 30k
  const discount = calculateDiscountAmount(voucher, 100000);
  assert.equal(discount, 30000);

  // Nếu tổng tiền nhỏ hơn giảm giá, giảm tối đa bằng tổng tiền
  const discountOver = calculateDiscountAmount(voucher, 20000);
  assert.equal(discountOver, 20000);
});
