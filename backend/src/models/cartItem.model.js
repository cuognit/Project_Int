import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const CartItem = sequelize.define(
  "CartItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        isInt: true,
      },
    },
  },
  {
    tableName: "cart_items",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "cart_items_cart_product_unique",
        unique: true,
        fields: ["cart_id", "product_id"],
      },
    ],
  },
);

export default CartItem;
