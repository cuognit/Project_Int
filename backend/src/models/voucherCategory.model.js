import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const VoucherCategory = sequelize.define("VoucherCategory", {
  voucherId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: "voucher_id",
  },
  categoryId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    field: "category_id",
  },
}, {
  tableName: "voucher_categories",
  timestamps: false,
  underscored: true,
});

export default VoucherCategory;
