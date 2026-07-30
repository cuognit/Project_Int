import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const USERS_TABLE = "users";

const hasUsersTable = async (queryInterface) => {
  const tables = await queryInterface.showAllTables();
  return tables.some((table) => {
    const tableName = typeof table === "string" ? table : table.tableName;
    return tableName === USERS_TABLE;
  });
};
// Bổ sung các cột xác thực người dùng còn thiếu theo cách an toàn.
export const migrateUserAuthColumns = async () => {
  const queryInterface = sequelize.getQueryInterface();

  if (!(await hasUsersTable(queryInterface))) return;

  let columns = await queryInterface.describeTable(USERS_TABLE);

  if (!columns.password) {
    await queryInterface.addColumn(USERS_TABLE, "password", {
      type: DataTypes.STRING(255),
      allowNull: true,
    });
  } else if (!columns.password.allowNull) {
    await queryInterface.changeColumn(USERS_TABLE, "password", {
      type: DataTypes.STRING(255),
      allowNull: true,
    });
  }

  if (!columns.google_sub) {
    await queryInterface.addColumn(USERS_TABLE, "google_sub", {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    });
  }

  if (!columns.role) {
    await queryInterface.addColumn(USERS_TABLE, "role", {
      type: DataTypes.ENUM("customer", "admin"),
      allowNull: false,
      defaultValue: "customer",
    });
  }

  if (!columns.is_active) {
    await queryInterface.addColumn(USERS_TABLE, "is_active", {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    });
  }
};
