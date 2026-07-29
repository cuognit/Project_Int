import crypto from "node:crypto";
import { OrderItem, Product } from "../models/index.js";
import { createNotifications } from "./notification.service.js";
import { releaseVoucherUsage } from "./voucher.service.js";

export const cancelLockedOrder = async (
  order,
  { transaction, paymentStatus = "CANCELLED", actor = "SYSTEM" },
) => {
  if (order.status === "CANCELLED") return false;

  const items = await OrderItem.findAll({
    where: { orderId: order.id },
    order: [["productId", "ASC"]],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  for (const item of items) {
    const product = await Product.findByPk(item.productId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (product) {
      await product.update({ stock: product.stock + item.quantity }, { transaction });
    }
  }

  await order.update({ status: "CANCELLED", paymentStatus }, { transaction });
  await releaseVoucherUsage(order.id, transaction);
  await createNotifications([
    {
      audience: "USER",
      recipientUserId: order.userId,
      type: "ORDER_CANCELLED",
      title: "Đơn hàng đã được hủy",
      message: `Đơn hàng ${order.orderCode} đã được hủy.`,
      orderId: order.id,
      metadata: { orderCode: order.orderCode, actor, paymentStatus },
      dedupeKey: `order:${order.id}:cancelled:user`,
    },
    {
      audience: "ADMIN",
      recipientUserId: null,
      type: "ORDER_CANCELLED",
      title: "Đơn hàng đã được hủy",
      message: `Đơn hàng ${order.orderCode} đã được hủy.`,
      orderId: order.id,
      metadata: { orderCode: order.orderCode, actor, paymentStatus },
      dedupeKey: `order:${order.id}:cancelled:admin:${crypto.randomUUID()}`,
    },
  ], { transaction });
  return true;
};
