import { DataTypes, QueryTypes } from "sequelize";
import sequelize from "../config/database.js";

const addColumn = async (table, column, definition) => {
  const qi = sequelize.getQueryInterface();
  const tableInfo = await qi.describeTable(table);
  if (!tableInfo[column]) await qi.addColumn(table, column, definition);
};

export const migratePayments = async () => {
  const qi = sequelize.getQueryInterface();
  const tables = await qi.showAllTables();
  if (!tables.includes("orders")) return;

  await addColumn("orders", "payment_method", {
    type: DataTypes.ENUM("COD", "VNPAY"),
    allowNull: false,
    defaultValue: "COD",
  });
  await addColumn("orders", "payment_status", {
    type: DataTypes.ENUM("PENDING", "PAID", "FAILED", "REFUNDING", "REFUNDED", "CANCELLED"),
    allowNull: false,
    defaultValue: "PENDING",
  });
  await addColumn("orders", "payment_expires_at", { type: DataTypes.DATE, allowNull: true });

  await sequelize.query(
    `UPDATE orders
     SET payment_status = CASE
       WHEN status = 'COMPLETED' THEN 'PAID'::enum_orders_payment_status
       WHEN status = 'CANCELLED' THEN 'CANCELLED'::enum_orders_payment_status
       ELSE payment_status
     END
     WHERE payment_method = 'COD'`,
    { type: QueryTypes.UPDATE },
  );

  if (!tables.includes("payments")) {
    await qi.createTable("payments", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: "orders", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      provider: { type: DataTypes.ENUM("VNPAY"), allowNull: false, defaultValue: "VNPAY" },
      txn_ref: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      status: {
        type: DataTypes.ENUM("PENDING", "PAID", "FAILED", "REFUNDING", "REFUNDED", "REFUND_FAILED"),
        allowNull: false,
        defaultValue: "PENDING",
      },
      create_date: { type: DataTypes.STRING(14), allowNull: false },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      transaction_no: { type: DataTypes.STRING(30), allowNull: true },
      bank_code: { type: DataTypes.STRING(20), allowNull: true },
      card_type: { type: DataTypes.STRING(20), allowNull: true },
      pay_date: { type: DataTypes.STRING(14), allowNull: true },
      response_code: { type: DataTypes.STRING(10), allowNull: true },
      transaction_status: { type: DataTypes.STRING(10), allowNull: true },
      last_callback_at: { type: DataTypes.DATE, allowNull: true },
      refund_request_id: { type: DataTypes.STRING(32), allowNull: true, unique: true },
      refund_response_code: { type: DataTypes.STRING(10), allowNull: true },
      refund_message: { type: DataTypes.STRING(255), allowNull: true },
      refund_transaction_no: { type: DataTypes.STRING(30), allowNull: true },
      refund_requested_by: { type: DataTypes.STRING(100), allowNull: true },
      refund_reason: { type: DataTypes.STRING(500), allowNull: true },
      refunded_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    });
    await qi.addIndex("payments", ["status", "expires_at"], { name: "payments_status_expires_idx" });
  } else {
    await addColumn("payments", "refund_reason", { type: DataTypes.STRING(500), allowNull: true });
  }

  const refreshedTables = await qi.showAllTables();
  if (!refreshedTables.includes("payment_actions")) {
    await qi.createTable("payment_actions", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      payment_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "payments", key: "id" },
        onDelete: "CASCADE",
      },
      admin_user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "RESTRICT",
      },
      action: { type: DataTypes.ENUM("RECONCILE", "REFUND"), allowNull: false },
      status: { type: DataTypes.ENUM("SUCCESS", "FAILED"), allowNull: false },
      reason: { type: DataTypes.STRING(500), allowNull: true },
      request_id: { type: DataTypes.STRING(64), allowNull: true },
      response_code: { type: DataTypes.STRING(20), allowNull: true },
      response_message: { type: DataTypes.STRING(500), allowNull: true },
      metadata: { type: DataTypes.JSONB, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: sequelize.literal("CURRENT_TIMESTAMP") },
    });
    await qi.addIndex("payment_actions", ["payment_id", "created_at"], {
      name: "payment_actions_payment_created_idx",
    });
  }
};
