import { DataTypes, QueryTypes } from "sequelize";
import sequelize from "../config/database.js";

export const DEFAULT_CATEGORY_NAME = "Chưa phân loại";

const tableExists = async (queryInterface, tableName) => {
  const tables = await queryInterface.showAllTables();
  return tables.some((table) =>
    (typeof table === "string" ? table : table.tableName) === tableName
  );
};

// Đồng bộ quan hệ danh mục sản phẩm và dữ liệu mặc định cần thiết.
export const migrateProductCategories = async () => {
  const queryInterface = sequelize.getQueryInterface();

  if (!(await tableExists(queryInterface, "categories"))) {
    await queryInterface.createTable("categories", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
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

  await sequelize.query(
    `INSERT INTO categories (name, created_at, updated_at)
     SELECT :name, NOW(), NOW()
     WHERE NOT EXISTS (
       SELECT 1 FROM categories WHERE LOWER(name) = LOWER(:name)
     )`,
    { replacements: { name: DEFAULT_CATEGORY_NAME } },
  );

  await sequelize.query(
    "CREATE UNIQUE INDEX IF NOT EXISTS categories_name_lower_unique ON categories (LOWER(name))",
  );

  if (!(await tableExists(queryInterface, "products"))) return;

  const productColumns = await queryInterface.describeTable("products");
  if (!productColumns.category_id) {
    await queryInterface.addColumn("products", "category_id", {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "categories", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });
  }

  const [defaultCategory] = await sequelize.query(
    "SELECT id FROM categories WHERE LOWER(name) = LOWER(:name) LIMIT 1",
    {
      replacements: { name: DEFAULT_CATEGORY_NAME },
      type: QueryTypes.SELECT,
    },
  );

  await sequelize.query(
    "UPDATE products SET category_id = :categoryId WHERE category_id IS NULL",
    { replacements: { categoryId: defaultCategory.id } },
  );

  const refreshedColumns = await queryInterface.describeTable("products");
  if (refreshedColumns.category_id.allowNull) {
    await queryInterface.changeColumn("products", "category_id", {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "categories", key: "id" },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    });
  }

  const indexes = await queryInterface.showIndex("products");
  if (!indexes.some((index) => index.name === "products_category_idx")) {
    await queryInterface.addIndex("products", ["category_id"], {
      name: "products_category_idx",
    });
  }
};
