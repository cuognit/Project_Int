import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PaymentAction = sequelize.define(
  "PaymentAction",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    action: { type: DataTypes.ENUM("RECONCILE", "REFUND"), allowNull: false },
    status: { type: DataTypes.ENUM("SUCCESS", "FAILED"), allowNull: false },
    reason: { type: DataTypes.STRING(500), allowNull: true },
    requestId: { type: DataTypes.STRING(64), allowNull: true, field: "request_id" },
    responseCode: { type: DataTypes.STRING(20), allowNull: true, field: "response_code" },
    responseMessage: { type: DataTypes.STRING(500), allowNull: true, field: "response_message" },
    metadata: { type: DataTypes.JSONB, allowNull: true },
  },
  { tableName: "payment_actions", timestamps: true, underscored: true },
);

export default PaymentAction;
