import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Cart = sequelize.define(
  "Cart",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: "ACTIVE",
      validate: {
        isIn: [["ACTIVE", "CONVERTED", "ABANDONED"]],
      },
    },
    convertedOrderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      unique: true,
      field: "converted_order_id",
    },
  },
  {
    tableName: "carts",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "carts_one_active_per_user",
        unique: true,
        fields: ["user_id"],
        where: { status: "ACTIVE" },
      },
    ],
  },
);

export default Cart;
