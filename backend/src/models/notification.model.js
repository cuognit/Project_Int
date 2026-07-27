import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Notification = sequelize.define(
  "Notification",
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    audience: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        isIn: [["USER", "ADMIN"]],
      },
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    dedupeKey: {
      type: DataTypes.STRING(160),
      allowNull: false,
      unique: true,
      field: "dedupe_key",
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "read_at",
    },
  },
  {
    tableName: "notifications",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        name: "notifications_recipient_unread_created_idx",
        fields: ["recipient_user_id", "read_at", "created_at"],
      },
      {
        name: "notifications_admin_unread_created_idx",
        fields: ["audience", "read_at", "created_at"],
      },
    ],
  },
);

export default Notification;
