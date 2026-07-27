import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const VoucherUsage = sequelize.define("VoucherUsage", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  eligibleSubtotal: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: "eligible_subtotal",
  },
  discountAmount: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    field: "discount_amount",
  },
  status: {
    type: DataTypes.ENUM("APPLIED", "RELEASED"),
    allowNull: false,
    defaultValue: "APPLIED",
  },
  releasedAt: { type: DataTypes.DATE, allowNull: true, field: "released_at" },
}, {
  tableName: "voucher_usages",
  timestamps: true,
  underscored: true,
});

export default VoucherUsage;
