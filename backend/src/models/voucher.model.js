import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Voucher = sequelize.define("Voucher", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(150), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  discountType: {
    type: DataTypes.ENUM("FIXED", "PERCENTAGE"),
    allowNull: false,
    field: "discount_type",
  },
  discountValue: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: "discount_value",
  },
  maxDiscountAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: true,
    field: "max_discount_amount",
  },
  minOrderAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: "min_order_amount",
  },
  scope: {
    type: DataTypes.ENUM("ALL", "CATEGORIES"),
    allowNull: false,
    defaultValue: "ALL",
  },
  audience: {
    type: DataTypes.ENUM("ALL", "TARGETED"),
    allowNull: false,
    defaultValue: "ALL",
  },
  startAt: { type: DataTypes.DATE, allowNull: false, field: "start_at" },
  endAt: { type: DataTypes.DATE, allowNull: false, field: "end_at" },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    field: "is_active",
  },
  totalUsageLimit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: "total_usage_limit",
  },
  perUserLimit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: "per_user_limit",
  },
}, {
  tableName: "vouchers",
  timestamps: true,
  underscored: true,
});

export default Voucher;
