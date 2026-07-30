import assert from "node:assert/strict";
import test from "node:test";
import { Notification, OrderItem, Product, VoucherUsage } from "../../src/models/index.js";
import { cancelLockedOrder } from "../../src/services/orderCancellation.service.js";

test("cancelLockedOrder - Trả về false nếu đơn hàng đã ở trạng thái CANCELLED", async () => {
  const mockOrder = { status: "CANCELLED" };
  const res = await cancelLockedOrder(mockOrder, { transaction: {} });
  assert.equal(res, false);
});

test("cancelLockedOrder - Hoàn trả tồn kho, chuyển trạng thái đơn hàng sang CANCELLED và trả về true", async () => {
  const origItemFindAll = OrderItem.findAll;
  const origProductFindByPk = Product.findByPk;
  const origVoucherUsageFindOne = VoucherUsage.findOne;
  const origNotifBulkCreate = Notification.bulkCreate;

  let stockUpdated = false;
  let orderUpdated = false;

  OrderItem.findAll = async () => [{ productId: 1, quantity: 2 }];
  Product.findByPk = async () => ({
    id: 1,
    stock: 5,
    update: async (data) => {
      stockUpdated = data.stock === 7;
    },
  });
  VoucherUsage.findOne = async () => null;
  Notification.bulkCreate = async (payloads) => payloads.map((p, i) => ({ id: i + 1, ...p }));

  const mockOrder = {
    id: 10,
    orderCode: "DH-001",
    userId: 1,
    status: "PROCESSING",
    update: async (data) => {
      if (data.status === "CANCELLED") orderUpdated = true;
    },
  };

  const mockTx = {
    LOCK: { UPDATE: "UPDATE" },
    afterCommit: (cb) => cb(),
  };

  try {
    const res = await cancelLockedOrder(mockOrder, {
      transaction: mockTx,
      paymentStatus: "CANCELLED",
      actor: "TEST",
    });

    assert.equal(res, true);
    assert.equal(stockUpdated, true);
    assert.equal(orderUpdated, true);
  } finally {
    OrderItem.findAll = origItemFindAll;
    Product.findByPk = origProductFindByPk;
    VoucherUsage.findOne = origVoucherUsageFindOne;
    Notification.bulkCreate = origNotifBulkCreate;
  }
});
