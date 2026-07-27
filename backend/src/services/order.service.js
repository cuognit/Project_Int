import crypto from "node:crypto";
import { col, Op, where as sequelizeWhere } from "sequelize";
import sequelize from "../config/database.js";
import {
  Cart,
  CartItem,
  Order,
  OrderItem,
  Product,
  User,
} from "../models/index.js";
import { createNotifications } from "./notification.service.js";

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

export const createOrder = async (userId, shippingInfo) => {
  const orderId = await sequelize.transaction(async (transaction) => {
    const cart = await Cart.findOne({
      where: { userId, status: "ACTIVE" },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!cart) throw serviceError(409, "Giỏ hàng đang trống");

    const cartItems = await CartItem.findAll({
      where: { cartId: cart.id },
      order: [["id", "ASC"]],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!cartItems.length) throw serviceError(409, "Giỏ hàng đang trống");

    const snapshots = [];
    let subtotal = 0;
    for (const cartItem of cartItems) {
      const product = await Product.findByPk(cartItem.productId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!product || !product.isActive) {
        throw serviceError(409, "Có sản phẩm đã ngừng kinh doanh");
      }
      if (product.stock < cartItem.quantity) {
        throw serviceError(
          409,
          `${product.name} chỉ còn ${product.stock} sản phẩm trong kho`,
        );
      }

      const unitPrice = Number(product.price);
      const totalPrice = unitPrice * cartItem.quantity;
      subtotal += totalPrice;
      snapshots.push({ cartItem, product, unitPrice, totalPrice });
    }

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
      totalAmount: subtotal,
    }, { transaction });

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
        metadata: { orderCode: order.orderCode, totalAmount: subtotal },
        dedupeKey: `order:${order.id}:created:user`,
      },
      {
        audience: "ADMIN",
        recipientUserId: null,
        type: "NEW_ORDER",
        title: "Có đơn hàng mới",
        message: `Đơn hàng ${order.orderCode} vừa được tạo.`,
        orderId: order.id,
        metadata: { orderCode: order.orderCode, userId, totalAmount: subtotal },
        dedupeKey: `order:${order.id}:created:admin`,
      },
    ], { transaction });

    return order.id;
  });

  return getOrderById(orderId);
};

export const updateOrderStatus = async (orderId, status) => {
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
    await order.update({ status }, { transaction });
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

export const cancelOrder = async (userId, orderId) => {
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
      if (!product) {
        throw serviceError(409, `Sản phẩm ${item.productName} không còn tồn tại`);
      }
      await product.update(
        { stock: product.stock + item.quantity },
        { transaction },
      );
    }

    await order.update({ status: "CANCELLED" }, { transaction });
    await createNotifications([
      {
        audience: "USER",
        recipientUserId: userId,
        type: "ORDER_CANCELLED",
        title: "Đơn hàng đã được hủy",
        message: `Đơn hàng ${order.orderCode} đã được hủy thành công.`,
        orderId: order.id,
        metadata: { orderCode: order.orderCode },
        dedupeKey: `order:${order.id}:cancelled:user`,
      },
      {
        audience: "ADMIN",
        recipientUserId: null,
        type: "ORDER_CANCELLED_BY_USER",
        title: "Khách hàng đã hủy đơn",
        message: `Đơn hàng ${order.orderCode} đã được khách hàng hủy.`,
        orderId: order.id,
        metadata: { orderCode: order.orderCode, userId },
        dedupeKey: `order:${order.id}:cancelled:admin`,
      },
    ], { transaction });
  });

  return getOrderById(orderId);
};
