import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Order = sequelize.define(
  "Order",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    orderCode: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      field: "order_code",
    },

    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "CONFIRMED",
        "SHIPPING",
        "COMPLETED",
        "CANCELLED"
      ),
      allowNull: false,
      defaultValue: "PENDING",
    },

    shippingName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      field: "shipping_name",
    },

    shippingPhone: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: "shipping_phone",
    },

    shippingAddress: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "shipping_address",
    },

    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },

    shippingFee: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "shipping_fee",
    },

    totalAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "total_amount",
    },

    voucherCode: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "voucher_code",
    },

    discountAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: "discount_amount",
    },

    note: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "orders",
    timestamps: true,
    underscored: true,
  }
);

export default Order;
