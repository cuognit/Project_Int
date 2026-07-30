import assert from "node:assert/strict";
import test from "node:test";
import { Payment } from "../../src/models/index.js";
import { getAdminPayment } from "../../src/services/paymentAdmin.service.js";

test("getAdminPayment - Báo lỗi 404 khi giao dịch không tồn tại", async () => {
  const origFindByPk = Payment.findByPk;
  Payment.findByPk = async () => null;

  try {
    await assert.rejects(
      getAdminPayment(9999),
      (err) => err.statusCode === 404,
    );
  } finally {
    Payment.findByPk = origFindByPk;
  }
});
