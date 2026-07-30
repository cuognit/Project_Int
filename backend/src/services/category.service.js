import { fn, col, Op } from "sequelize";
import sequelize from "../config/database.js";
import { Category, Product, VoucherCategory } from "../models/index.js";
import { DEFAULT_CATEGORY_NAME } from "../database/productCategory.migration.js";

// Lấy danh mục kèm số lượng sản phẩm liên quan.
export const getCategories = async () => {
  const categories = await Category.findAll({
    attributes: [
      "id",
      "name",
      [fn("COUNT", col("products.id")), "activeProductCount"],
      "createdAt",
      "updatedAt",
    ],
    include: [{
      model: Product,
      as: "products",
      attributes: [],
      required: false,
      where: { isActive: true },
    }],
    group: ["Category.id"],
    order: [["name", "ASC"]],
    raw: true,
  });

  return categories.map((category) => ({
    ...category,
    activeProductCount: Number(category.activeProductCount || 0),
    isDefault: category.name === DEFAULT_CATEGORY_NAME,
  }));
};

const findDuplicate = (name, excludeId) => Category.findOne({
  where: {
    name: { [Op.iLike]: name },
    ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
  },
});

// Tạo danh mục sau khi kiểm tra tên trùng lặp.
export const createCategory = async (name) => {
  if (await findDuplicate(name)) {
    const error = new Error("Tên danh mục đã tồn tại");
    error.statusCode = 409;
    throw error;
  }
  return Category.create({ name });
};

// Đổi tên danh mục và ngăn trùng tên với danh mục khác.
export const updateCategory = async (id, name) => {
  const category = await Category.findByPk(id);
  if (!category) {
    const error = new Error("Không tìm thấy danh mục");
    error.statusCode = 404;
    throw error;
  }
  if (category.name === DEFAULT_CATEGORY_NAME) {
    const error = new Error("Không thể đổi tên danh mục mặc định");
    error.statusCode = 409;
    throw error;
  }
  if (await findDuplicate(name, category.id)) {
    const error = new Error("Tên danh mục đã tồn tại");
    error.statusCode = 409;
    throw error;
  }
  category.name = name;
  await category.save();
  return category;
};

// Xóa danh mục và xử lý các liên kết sản phẩm trong cùng transaction.
export const deleteCategory = async (id) => sequelize.transaction(async (transaction) => {
  const category = await Category.findByPk(id, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (!category) {
    const error = new Error("Không tìm thấy danh mục");
    error.statusCode = 404;
    throw error;
  }
  if (category.name === DEFAULT_CATEGORY_NAME) {
    const error = new Error("Không thể xóa danh mục mặc định");
    error.statusCode = 409;
    throw error;
  }
  if (await VoucherCategory.count({ where: { categoryId: category.id }, transaction })) {
    const error = new Error("Danh mục đang được voucher sử dụng. Vui lòng gỡ khỏi voucher trước");
    error.statusCode = 409;
    throw error;
  }

  const defaultCategory = await Category.findOne({
    where: { name: DEFAULT_CATEGORY_NAME },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  const [movedProducts] = await Product.update(
    { categoryId: defaultCategory.id },
    { where: { categoryId: category.id }, transaction },
  );
  await category.destroy({ transaction });
  return { id: category.id, movedProducts };
});
