import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const tableExists = async (queryInterface, tableName) => {
  const tables = await queryInterface.showAllTables();
  return tables.some((table) =>
    (typeof table === "string" ? table : table.tableName) === tableName
  );
};

const addIndexIfMissing = async (queryInterface, tableName, fields, options) => {
  const indexes = await queryInterface.showIndex(tableName);
  if (!indexes.some((index) => index.name === options.name)) {
    await queryInterface.addIndex(tableName, fields, options);
  }
};

export const migrateVouchers = async () => {
  const queryInterface = sequelize.getQueryInterface();
  if (!(await tableExists(queryInterface, "orders"))) return;

  if (!(await tableExists(queryInterface, "vouchers"))) {
    await queryInterface.createTable("vouchers", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(150), allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      discount_type: { type: DataTypes.ENUM("FIXED", "PERCENTAGE"), allowNull: false },
      discount_value: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      max_discount_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
      min_order_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
      scope: { type: DataTypes.ENUM("ALL", "CATEGORIES"), allowNull: false, defaultValue: "ALL" },
      audience: { type: DataTypes.ENUM("ALL", "TARGETED"), allowNull: false, defaultValue: "ALL" },
      start_at: { type: DataTypes.DATE, allowNull: false },
      end_at: { type: DataTypes.DATE, allowNull: false },
      is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      total_usage_limit: { type: DataTypes.INTEGER, allowNull: true },
      per_user_limit: { type: DataTypes.INTEGER, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
  }
  await sequelize.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS vouchers_code_upper_unique ON vouchers (UPPER(code))",
  );

  if (!(await tableExists(queryInterface, "voucher_categories"))) {
    await queryInterface.createTable("voucher_categories", {
      voucher_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "vouchers", key: "id" },
        onDelete: "CASCADE",
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "categories", key: "id" },
        onDelete: "RESTRICT",
      },
    });
  }

  if (!(await tableExists(queryInterface, "voucher_users"))) {
    await queryInterface.createTable("voucher_users", {
      voucher_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "vouchers", key: "id" },
        onDelete: "CASCADE",
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        primaryKey: true,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
    });
  }

  const orderColumns = await queryInterface.describeTable("orders");
  if (!orderColumns.voucher_id) {
    await queryInterface.addColumn("orders", "voucher_id", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "vouchers", key: "id" },
      onDelete: "SET NULL",
    });
  }
  if (!orderColumns.voucher_code) {
    await queryInterface.addColumn("orders", "voucher_code", {
      type: DataTypes.STRING(50),
      allowNull: true,
    });
  }
  if (!orderColumns.discount_amount) {
    await queryInterface.addColumn("orders", "discount_amount", {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    });
  }

  if (!(await tableExists(queryInterface, "voucher_usages"))) {
    await queryInterface.createTable("voucher_usages", {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      voucher_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "vouchers", key: "id" },
        onDelete: "RESTRICT",
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "RESTRICT",
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: "orders", key: "id" },
        onDelete: "CASCADE",
      },
      eligible_subtotal: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      discount_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
      status: { type: DataTypes.ENUM("APPLIED", "RELEASED"), allowNull: false, defaultValue: "APPLIED" },
      released_at: { type: DataTypes.DATE, allowNull: true },
      created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    });
  }
  await addIndexIfMissing(
    queryInterface,
    "voucher_usages",
    ["voucher_id", "status"],
    { name: "voucher_usages_voucher_status_idx" },
  );
  await addIndexIfMissing(
    queryInterface,
    "voucher_usages",
    ["voucher_id", "user_id", "status"],
    { name: "voucher_usages_voucher_user_status_idx" },
  );
};
