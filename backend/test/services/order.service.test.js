import assert from "node:assert/strict";
import test from "node:test";
import { Order } from "../../src/models/index.js";
import { getOrderById } from "../../src/services/order.service.js";

test("getOrderById - Lấy chi tiết đơn hàng theo ID kèm theo các quan hệ đi kèm", async () => {
  const origFindByPk = Order.findByPk;
  Order.findByPk = async (id) => ({
    id,
    orderCode: "DH-20260730-12345678",
    totalAmount: 150000,
    status: "PENDING",
  });

  try {
    const order = await getOrderById(100);
    assert.equal(order.id, 100);
    assert.equal(order.orderCode, "DH-20260730-12345678");
  } finally {
    Order.findByPk = origFindByPk;
  }
});
