import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Payment = sequelize.define(
  "Payment",
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    provider: { type: DataTypes.ENUM("VNPAY"), allowNull: false, defaultValue: "VNPAY" },
    txnRef: { type: DataTypes.STRING(100), allowNull: false, unique: true, field: "txn_ref" },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    status: {
      type: DataTypes.ENUM("PENDING", "PAID", "FAILED", "REFUNDING", "REFUNDED", "REFUND_FAILED"),
      allowNull: false,
      defaultValue: "PENDING",
    },
    createDate: { type: DataTypes.STRING(14), allowNull: false, field: "create_date" },
    expiresAt: { type: DataTypes.DATE, allowNull: false, field: "expires_at" },
    transactionNo: { type: DataTypes.STRING(30), allowNull: true, field: "transaction_no" },
    bankCode: { type: DataTypes.STRING(20), allowNull: true, field: "bank_code" },
    cardType: { type: DataTypes.STRING(20), allowNull: true, field: "card_type" },
    payDate: { type: DataTypes.STRING(14), allowNull: true, field: "pay_date" },
    responseCode: { type: DataTypes.STRING(10), allowNull: true, field: "response_code" },
    transactionStatus: { type: DataTypes.STRING(10), allowNull: true, field: "transaction_status" },
    lastCallbackAt: { type: DataTypes.DATE, allowNull: true, field: "last_callback_at" },
    refundRequestId: { type: DataTypes.STRING(32), allowNull: true, unique: true, field: "refund_request_id" },
    refundResponseCode: { type: DataTypes.STRING(10), allowNull: true, field: "refund_response_code" },
    refundMessage: { type: DataTypes.STRING(255), allowNull: true, field: "refund_message" },
    refundTransactionNo: { type: DataTypes.STRING(30), allowNull: true, field: "refund_transaction_no" },
    refundRequestedBy: { type: DataTypes.STRING(100), allowNull: true, field: "refund_requested_by" },
    refundReason: { type: DataTypes.STRING(500), allowNull: true, field: "refund_reason" },
    refundedAt: { type: DataTypes.DATE, allowNull: true, field: "refunded_at" },
  },
  {
    tableName: "payments",
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ["status", "expires_at"] },
      { fields: ["order_id"] },
    ],
  },
);

export default Payment;
