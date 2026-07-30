import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const TABLE_NAME = "refresh_sessions";

// Tạo bảng lưu phiên refresh token nếu bảng chưa tồn tại.
export const migrateRefreshSessions = async () => {
  const queryInterface = sequelize.getQueryInterface();
  const tables = await queryInterface.showAllTables();
  const exists = tables.some((table) => {
    const tableName = typeof table === "string" ? table : table.tableName;
    return tableName === TABLE_NAME;
  });

  if (exists) return;

  await queryInterface.createTable(TABLE_NAME, {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    token_hash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  });

  await queryInterface.addIndex(TABLE_NAME, ["user_id", "expires_at"], {
    name: "refresh_sessions_user_expiry_idx",
  });
};
