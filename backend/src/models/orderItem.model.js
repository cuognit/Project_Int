import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const OrderItem = sequelize.define(
  "OrderItem",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },

    productName: {
      type: DataTypes.STRING(150),
      allowNull: false,
      field: "product_name",
    },

    productSku: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: "product_sku",
    },

    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
      },
    },

    unitPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "unit_price",
      validate: {
        min: 0,
      },
    },

    totalPrice: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      field: "total_price",
      validate: {
        min: 0,
      },
    },
  },
  {
    tableName: "order_items",
    timestamps: false,
    underscored: true,
  }
);

export default OrderItem;