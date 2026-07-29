import crypto from "node:crypto";
import { col, Op, where as sequelizeWhere } from "sequelize";
import sequelize from "../config/database.js";
import {
  Cart,
  CartItem,
  Order,
  OrderItem,
  Product,
  Payment,
  User,
  VoucherUsage,
} from "../models/index.js";
import { createNotifications } from "./notification.service.js";
import {
  getCartPricing,
  releaseVoucherUsage,
  validateVoucherForCart,
} from "./voucher.service.js";
import { cancelLockedOrder } from "./orderCancellation.service.js";
import { createVnpayPayment, refundPaidOrder } from "./vnpay.service.js";

const serviceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const orderIncludes = [
  {
    model: User,
    as: "user",
    attributes: ["id", "fullName", "email"],
  },
  {
    model: OrderItem,
    as: "items",
    include: [{
      model: Product,
      as: "product",
      attributes: ["id", "name", "sku", "imageUrl", "isActive"],
    }],
  },
  {
    model: Payment,
    as: "payment",
    attributes: [
      "id", "provider", "txnRef", "status", "transactionNo", "bankCode",
      "cardType", "payDate", "responseCode", "transactionStatus",
      "refundResponseCode", "refundMessage", "refundedAt", "expiresAt",
    ],
  },
];

const makeOrderCode = () => {
  const date = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `DH-${date}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
};

export const getOrderById = (orderId) =>
  Order.findByPk(orderId, { include: orderIncludes });

export const getOrders = ({ userId } = {}) => {
  const where = userId ? { userId } : {};
  return Order.findAll({
    where,
    include: [{
      model: OrderItem,
      as: "items",
      include: [{
        model: Product,
        as: "product",
        attributes: ["id", "imageUrl"],
      }],
    }],
    order: [["createdAt", "DESC"]],
  });
};

export const getMyOrders = async (
  userId,
  { page, limit, status, search },
) => {
  const where = { userId };
  const include = [];
  if (search) {
    const pattern = `%${search}%`;
    where[Op.or] = [
      { orderCode: { [Op.iLike]: pattern } },
      sequelizeWhere(col("items.product_name"), { [Op.iLike]: pattern }),
    ];
    include.push({
      model: OrderItem,
      as: "items",
      attributes: [],
      required: false,
    });
  }

  const matchingOrders = await Order.findAll({
    attributes: ["id", "status", "createdAt"],
    where,
    include,
    group: ["Order.id", "Order.status", "Order.created_at"],
    order: [["createdAt", "DESC"]],
    subQuery: false,
    raw: true,
  });

  const counts = {
    ALL: matchingOrders.length,
    PENDING: 0,
    CONFIRMED: 0,
    SHIPPING: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  };
  matchingOrders.forEach((order) => {
    if (counts[order.status] !== undefined) counts[order.status] += 1;
  });

  const filtered = status === "ALL"
    ? matchingOrders
    : matchingOrders.filter((order) => order.status === status);
  const offset = (page - 1) * limit;
  const pageIds = filtered.slice(offset, offset + limit).map((order) => order.id);
  const items = pageIds.length
    ? await Order.findAll({
        where: { id: { [Op.in]: pageIds } },
        include: [{
          model: OrderItem,
          as: "items",
          include: [{
            model: Product,
            as: "product",
            attributes: ["id", "imageUrl"],
          }],
        }],
        order: [["createdAt", "DESC"]],
      })
    : [];

  return {
    items,
    counts,
    pagination: {
      page,
      limit,
      totalItems: filtered.length,
      totalPages: Math.max(1, Math.ceil(filtered.length / limit)),
      hasMore: offset + items.length < filtered.length,
    },
  };
};

export const createOrder = async (userId, shippingInfo, ipAddress) => {
  const result = await sequelize.transaction(async (transaction) => {
    const pricing = await getCartPricing(userId, { transaction, lock: true });
    const { cart, items: snapshots, subtotal } = pricing;
    for (const { cartItem, product } of snapshots) {
      if (product.stock < cartItem.quantity) {
        throw serviceError(
          409,
          `${product.name} chỉ còn ${product.stock} sản phẩm trong kho`,
        );
      }

    }

    const voucherResult = shippingInfo.voucherCode
      ? await validateVoucherForCart(userId, shippingInfo.voucherCode, {
          transaction,
          lock: true,
          pricing,
        })
      : null;
    const discountAmount = voucherResult?.discountAmount || 0;

    const order = await Order.create({
      userId,
      orderCode: makeOrderCode(),
      status: "PENDING",
      shippingName: shippingInfo.shippingName,
      shippingPhone: shippingInfo.shippingPhone,
      shippingAddress: shippingInfo.shippingAddress,
      note: shippingInfo.note,
      subtotal,
      shippingFee: 0,
      voucherId: voucherResult?.voucher.id || null,
      voucherCode: voucherResult?.voucher.code || null,
      discountAmount,
      totalAmount: subtotal - discountAmount,
      paymentMethod: shippingInfo.paymentMethod,
      paymentStatus: "PENDING",
    }, { transaction });

    if (voucherResult) {
      await VoucherUsage.create({
        voucherId: voucherResult.voucher.id,
        userId,
        orderId: order.id,
        eligibleSubtotal: voucherResult.eligibleSubtotal,
        discountAmount,
        status: "APPLIED",
      }, { transaction });
    }

    await OrderItem.bulkCreate(snapshots.map(({ cartItem, product, unitPrice, totalPrice }) => ({
      orderId: order.id,
      productId: product.id,
      productName: product.name,
      productSku: product.sku,
      quantity: cartItem.quantity,
      unitPrice,
      totalPrice,
    })), { transaction });

    for (const { cartItem, product } of snapshots) {
      await product.update(
        { stock: product.stock - cartItem.quantity },
        { transaction },
      );
    }

    await cart.update(
      { status: "CONVERTED", convertedOrderId: order.id },
      { transaction },
    );

    await createNotifications([
      {
        audience: "USER",
        recipientUserId: userId,
        type: "ORDER_CREATED",
        title: "Đặt hàng thành công",
        message: `Đơn hàng ${order.orderCode} đang chờ xác nhận.`,
        orderId: order.id,
        metadata: { orderCode: order.orderCode, totalAmount: subtotal - discountAmount },
        dedupeKey: `order:${order.id}:created:user`,
      },
      {
        audience: "ADMIN",
        recipientUserId: null,
        type: "NEW_ORDER",
        title: "Có đơn hàng mới",
        message: `Đơn hàng ${order.orderCode} vừa được tạo.`,
        orderId: order.id,
        metadata: { orderCode: order.orderCode, userId, totalAmount: subtotal - discountAmount },
        dedupeKey: `order:${order.id}:created:admin`,
      },
    ], { transaction });

    const vnpay = shippingInfo.paymentMethod === "VNPAY"
      ? await createVnpayPayment(order, ipAddress, transaction)
      : null;
    return { orderId: order.id, paymentUrl: vnpay?.paymentUrl || null };
  });

  const order = await getOrderById(result.orderId);
  return { ...order.toJSON(), paymentUrl: result.paymentUrl };
};

export const updateOrderStatus = async (orderId, status, requestedBy = "admin", ipAddress) => {
  const current = await Order.findByPk(orderId);
  if (!current) throw serviceError(404, "Không tìm thấy đơn hàng");
  if (
    status === "CANCELLED"
    && current.paymentMethod === "VNPAY"
    && current.paymentStatus === "PENDING"
  ) {
    throw serviceError(409, "Giao dịch VNPay đang chờ xử lý, chưa thể hủy đơn");
  }
  if (status === "CANCELLED" && current.paymentMethod === "VNPAY" && current.paymentStatus === "PAID") {
    await refundPaidOrder(orderId, requestedBy, ipAddress);
    return getOrderById(orderId);
  }
  return sequelize.transaction(async (transaction) => {
    const order = await Order.findByPk(orderId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!order) throw serviceError(404, "Không tìm thấy đơn hàng");
    if (order.status === "CANCELLED" && status !== "CANCELLED") {
      throw serviceError(409, "Đơn hàng đã hủy không thể chuyển sang trạng thái khác");
    }
    if (order.status === status) return order;
    if (
      order.paymentMethod === "VNPAY"
      && order.paymentStatus !== "PAID"
      && ["CONFIRMED", "SHIPPING", "COMPLETED"].includes(status)
    ) {
      throw serviceError(409, "Đơn VNPay chưa thanh toán không thể xử lý");
    }
    if (status === "CANCELLED") {
      await cancelLockedOrder(order, {
        transaction,
        paymentStatus: order.paymentMethod === "VNPAY" ? "FAILED" : "CANCELLED",
        actor: requestedBy,
      });
      const payment = await Payment.findOne({ where: { orderId }, transaction });
      if (payment?.status === "PENDING") {
        await payment.update({ status: "FAILED", responseCode: "CANCELLED" }, { transaction });
      }
      return order;
    }
    await order.update({ status }, { transaction });
    if (status === "COMPLETED" && order.paymentMethod === "COD") {
      await order.update({ paymentStatus: "PAID" }, { transaction });
    }
    const statusLabels = {
      PENDING: "đang chờ xử lý",
      CONFIRMED: "đã được xác nhận",
      SHIPPING: "đang được giao",
      COMPLETED: "đã hoàn thành",
      CANCELLED: "đã bị hủy",
    };
    await createNotifications([{
      audience: "USER",
      recipientUserId: order.userId,
      type: "ORDER_STATUS_UPDATED",
      title: "Trạng thái đơn hàng đã thay đổi",
      message: `Đơn hàng ${order.orderCode} ${statusLabels[status]}.`,
      orderId: order.id,
      metadata: { orderCode: order.orderCode, status },
      dedupeKey: `order:${order.id}:status:${status}:${crypto.randomUUID()}`,
    }], { transaction });
    return order;
  });
};

export const cancelOrder = async (userId, orderId, ipAddress) => {
  const current = await Order.findOne({ where: { id: orderId, userId } });
  if (!current) throw serviceError(404, "Không tìm thấy đơn hàng");
  if (current.status !== "PENDING") {
    throw serviceError(409, "Chỉ có thể hủy đơn hàng đang chờ xử lý");
  }
  if (current.paymentMethod === "VNPAY" && current.paymentStatus === "PENDING") {
    throw serviceError(409, "Giao dịch VNPay đang chờ xử lý, chưa thể hủy đơn");
  }
  if (current.paymentMethod === "VNPAY" && current.paymentStatus === "PAID") {
    await refundPaidOrder(orderId, `customer:${userId}`, ipAddress);
    return getOrderById(orderId);
  }
  await sequelize.transaction(async (transaction) => {
    const order = await Order.findOne({
      where: { id: orderId, userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!order) {
      throw serviceError(404, "Không tìm thấy đơn hàng");
    }
    if (order.status !== "PENDING") {
      throw serviceError(409, "Chỉ có thể hủy đơn hàng đang chờ xử lý");
    }

    await cancelLockedOrder(order, {
      transaction,
      paymentStatus: order.paymentMethod === "VNPAY" ? "FAILED" : "CANCELLED",
      actor: `customer:${userId}`,
    });
    const payment = await Payment.findOne({ where: { orderId }, transaction });
    if (payment?.status === "PENDING") {
      await payment.update({ status: "FAILED", responseCode: "CANCELLED" }, { transaction });
    }
  });

  return getOrderById(orderId);
};
