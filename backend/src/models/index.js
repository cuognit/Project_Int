import User from "./user.model.js";
import Product from "./product.model.js";
import Order from "./order.model.js";
import OrderItem from "./orderItem.model.js";
import RefreshSession from "./refreshSession.model.js";
import Cart from "./cart.model.js";
import CartItem from "./cartItem.model.js";
import Notification from "./notification.model.js";
import Category from "./category.model.js";

Category.hasMany(Product, {
  foreignKey: { name: "categoryId", allowNull: false },
  as: "products",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Product.belongsTo(Category, {
  foreignKey: { name: "categoryId", allowNull: false },
  as: "category",
});

// User 1 - N Order
User.hasMany(Order, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  as: "orders",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Order.belongsTo(User, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  as: "user",
});

// Order 1 - N OrderItem
Order.hasMany(OrderItem, {
  foreignKey: {
    name: "orderId",
    allowNull: false,
  },
  as: "items",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

OrderItem.belongsTo(Order, {
  foreignKey: {
    name: "orderId",
    allowNull: false,
  },
  as: "order",
});

// Product 1 - N OrderItem
Product.hasMany(OrderItem, {
  foreignKey: {
    name: "productId",
    allowNull: false,
  },
  as: "orderItems",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

OrderItem.belongsTo(Product, {
  foreignKey: {
    name: "productId",
    allowNull: false,
  },
  as: "product",
});

User.hasMany(RefreshSession, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  as: "refreshSessions",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

RefreshSession.belongsTo(User, {
  foreignKey: {
    name: "userId",
    allowNull: false,
  },
  as: "user",
});

User.hasMany(Cart, {
  foreignKey: { name: "userId", allowNull: false },
  as: "carts",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Cart.belongsTo(User, {
  foreignKey: { name: "userId", allowNull: false },
  as: "user",
});

Cart.hasMany(CartItem, {
  foreignKey: { name: "cartId", allowNull: false },
  as: "items",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

CartItem.belongsTo(Cart, {
  foreignKey: { name: "cartId", allowNull: false },
  as: "cart",
});

Product.hasMany(CartItem, {
  foreignKey: { name: "productId", allowNull: false },
  as: "cartItems",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

CartItem.belongsTo(Product, {
  foreignKey: { name: "productId", allowNull: false },
  as: "product",
});

Order.hasOne(Cart, {
  foreignKey: { name: "convertedOrderId", allowNull: true },
  as: "sourceCart",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

Cart.belongsTo(Order, {
  foreignKey: { name: "convertedOrderId", allowNull: true },
  as: "convertedOrder",
});

User.hasMany(Notification, {
  foreignKey: { name: "recipientUserId", allowNull: true },
  as: "notifications",
  onDelete: "CASCADE",
  onUpdate: "CASCADE",
});

Notification.belongsTo(User, {
  foreignKey: { name: "recipientUserId", allowNull: true },
  as: "recipient",
});

User.hasMany(Notification, {
  foreignKey: { name: "readByUserId", allowNull: true },
  as: "readNotifications",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Notification.belongsTo(User, {
  foreignKey: { name: "readByUserId", allowNull: true },
  as: "readBy",
});

Order.hasMany(Notification, {
  foreignKey: { name: "orderId", allowNull: true },
  as: "notifications",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});

Notification.belongsTo(Order, {
  foreignKey: { name: "orderId", allowNull: true },
  as: "order",
});

export {
  User,
  Product,
  Order,
  OrderItem,
  RefreshSession,
  Cart,
  CartItem,
  Notification,
  Category,
};
