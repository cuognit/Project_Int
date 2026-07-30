import assert from "node:assert/strict";
import test from "node:test";
import { formatVnpDate } from "../../src/services/vnpay.service.js";

test("formatVnpDate - Định dạng thời gian chuẩn theo mẫu YYYYMMDDHHmmss của VNPay", () => {
  const date = new Date("2026-07-30T10:15:30.000Z");
  const formatted = formatVnpDate(date);
  assert.equal(typeof formatted, "string");
  assert.equal(formatted.length, 14);
});
