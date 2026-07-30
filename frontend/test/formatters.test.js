import assert from "node:assert/strict";
import test from "node:test";
import { formatCurrency } from "../src/utils/formatCurrency.js";
import { formatDate } from "../src/utils/formatDate.js";

test("formatCurrency - Định dạng số thành chuỗi tiền tệ VND", () => {
  const result = formatCurrency(50000);
  assert.equal(typeof result, "string");
  assert.ok(result.includes("50.000") || result.includes("50,000"));
});

test("formatDate - Định dạng chuỗi ISO/Date thành ngày tháng tiếng Việt", () => {
  const formatted = formatDate("2026-07-30T10:00:00.000Z");
  assert.equal(typeof formatted, "string");
  assert.ok(formatted.length > 0);
});
