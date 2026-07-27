import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const RefreshSession = sequelize.define(
  "RefreshSession",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    tokenHash: {
      type: DataTypes.STRING(64),
      allowNull: false,
      unique: true,
      field: "token_hash",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
    revokedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "revoked_at",
    },
  },
  {
    tableName: "refresh_sessions",
    timestamps: true,
    underscored: true,
  },
);

export default RefreshSession;
