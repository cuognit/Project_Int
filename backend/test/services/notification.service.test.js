import assert from "node:assert/strict";
import test from "node:test";
import { Notification } from "../../src/models/index.js";
import {
  createNotifications,
  getNotifications,
  getUnreadCount,
  markAsRead,
  serializeNotification,
} from "../../src/services/notification.service.js";

test("serializeNotification - Chuẩn hóa đúng cấu trúc đối tượng thông báo", () => {
  const notif = {
    id: 1,
    type: "ORDER_CREATED",
    title: "Đơn mới",
    message: "Nội dung",
    metadata: { a: 1 },
    orderId: 10,
    readAt: null,
    createdAt: new Date(),
  };
  const serialized = serializeNotification(notif);
  assert.equal(serialized.id, 1);
  assert.equal(serialized.type, "ORDER_CREATED");
  assert.equal(serialized.orderId, 10);
});

test("createNotifications - Tạo thông báo hàng loạt và trả về danh sách đã tạo", async () => {
  const origBulk = Notification.bulkCreate;
  Notification.bulkCreate = async (payloads) =>
    payloads.map((p, idx) => ({ id: idx + 1, ...p }));

  try {
    const list = await createNotifications([
      { audience: "ADMIN", type: "TEST", title: "T1", message: "M1" },
    ]);
    assert.equal(list.length, 1);
    assert.equal(list[0].id, 1);
  } finally {
    Notification.bulkCreate = origBulk;
  }
});

test("getNotifications - Trả về danh sách thông báo và số lượng chưa đọc theo vai trò", async () => {
  const origFindAll = Notification.findAll;
  const origCount = Notification.count;

  Notification.findAll = async () => [
    { id: 1, type: "TEST", title: "T1", message: "M1" },
  ];
  Notification.count = async () => 1;

  try {
    const res = await getNotifications({ role: "admin" }, 10);
    assert.equal(res.unreadCount, 1);
    assert.equal(res.items.length, 1);
  } finally {
    Notification.findAll = origFindAll;
    Notification.count = origCount;
  }
});

test("markAsRead - Báo lỗi 404 khi không tìm thấy thông báo hoặc cập nhật thời gian đã đọc", async () => {
  const origFindOne = Notification.findOne;

  Notification.findOne = async () => null;
  try {
    await assert.rejects(
      markAsRead({ role: "customer", id: 5 }, 999),
      (err) => err.statusCode === 404,
    );
  } finally {
    Notification.findOne = origFindOne;
  }
});
