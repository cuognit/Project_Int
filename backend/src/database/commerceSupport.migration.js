import { DataTypes, Op } from "sequelize";
import sequelize from "../config/database.js";

const tableExists = async (queryInterface, tableName) => {
  const tables = await queryInterface.showAllTables();
  return tables.some((table) =>
    (typeof table === "string" ? table : table.tableName) === tableName
  );
};

const indexExists = async (queryInterface, tableName, indexName) => {
  const indexes = await queryInterface.showIndex(tableName);
  return indexes.some((index) => index.name === indexName);
};

const constraintExists = async (constraintName) => {
  const [rows] = await sequelize.query(
    `SELECT 1 FROM pg_constraint WHERE conname = :constraintName LIMIT 1`,
    { replacements: { constraintName } },
  );
  return rows.length > 0;
};

const addCheckConstraint = async (
  queryInterface,
  tableName,
  name,
  fields,
  where,
) => {
  if (await constraintExists(name)) return;
  await queryInterface.addConstraint(tableName, {
    fields,
    type: "check",
    where,
    name,
  });
};

export const migrateCommerceSupportTables = async () => {
  const queryInterface = sequelize.getQueryInterface();

  if (!(await tableExists(queryInterface, "carts"))) {
    await queryInterface.createTable("carts", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "ACTIVE",
      },
      converted_order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        unique: true,
        references: { model: "orders", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
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
  }

  if (!(await indexExists(queryInterface, "carts", "carts_one_active_per_user"))) {
    await queryInterface.addIndex("carts", ["user_id"], {
      name: "carts_one_active_per_user",
      unique: true,
      where: { status: "ACTIVE" },
    });
  }
  if (!(await indexExists(queryInterface, "carts", "carts_user_created_idx"))) {
    await queryInterface.addIndex("carts", ["user_id", "created_at"], {
      name: "carts_user_created_idx",
    });
  }
  await addCheckConstraint(
    queryInterface,
    "carts",
    "carts_status_check",
    ["status"],
    { status: ["ACTIVE", "CONVERTED", "ABANDONED"] },
  );
  if (!(await constraintExists("carts_conversion_check"))) {
    await sequelize.query(`
      ALTER TABLE carts
      ADD CONSTRAINT carts_conversion_check CHECK (
        (status = 'CONVERTED' AND converted_order_id IS NOT NULL)
        OR
        (status IN ('ACTIVE', 'ABANDONED') AND converted_order_id IS NULL)
      )
    `);
  }

  if (!(await tableExists(queryInterface, "cart_items"))) {
    await queryInterface.createTable("cart_items", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      cart_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "carts", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: "products", key: "id" },
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
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
  }

  if (!(await indexExists(queryInterface, "cart_items", "cart_items_cart_product_unique"))) {
    await queryInterface.addIndex("cart_items", ["cart_id", "product_id"], {
      name: "cart_items_cart_product_unique",
      unique: true,
    });
  }
  await addCheckConstraint(
    queryInterface,
    "cart_items",
    "cart_items_quantity_positive",
    ["quantity"],
    { quantity: { [Op.gt]: 0 } },
  );

  if (!(await tableExists(queryInterface, "notifications"))) {
    await queryInterface.createTable("notifications", {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
      },
      audience: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      recipient_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
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
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "orders", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      dedupe_key: {
        type: DataTypes.STRING(160),
        allowNull: false,
        unique: true,
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      read_by_user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
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
  }

  const notificationIndexes = [
    {
      name: "notifications_recipient_unread_created_idx",
      fields: ["recipient_user_id", "read_at", "created_at"],
    },
    {
      name: "notifications_admin_unread_created_idx",
      fields: ["audience", "read_at", "created_at"],
    },
    {
      name: "notifications_order_idx",
      fields: ["order_id"],
    },
  ];
  for (const index of notificationIndexes) {
    if (!(await indexExists(queryInterface, "notifications", index.name))) {
      await queryInterface.addIndex("notifications", index.fields, {
        name: index.name,
      });
    }
  }
  await addCheckConstraint(
    queryInterface,
    "notifications",
    "notifications_audience_check",
    ["audience"],
    { audience: ["USER", "ADMIN"] },
  );
  if (!(await constraintExists("notifications_recipient_check"))) {
    await sequelize.query(`
      ALTER TABLE notifications
      ADD CONSTRAINT notifications_recipient_check CHECK (
        (audience = 'USER' AND recipient_user_id IS NOT NULL)
        OR
        (audience = 'ADMIN' AND recipient_user_id IS NULL)
      )
    `);
  }
};
