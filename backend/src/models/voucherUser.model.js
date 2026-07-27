import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const VoucherUser = sequelize.define("VoucherUser", {
  voucherId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: "voucher_id",
  },
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: "user_id",
  },
}, {
  tableName: "voucher_users",
  timestamps: false,
  underscored: true,
});

export default VoucherUser;
