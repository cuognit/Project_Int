import { Op } from "sequelize";
import { CartItem, Category, OrderItem, Product } from "../models/index.js";

const PRODUCT_FIELDS = [
  "id", "name", "sku", "description", "price", "stock",
  "imageUrl", "isActive", "categoryId", "createdAt", "updatedAt",
];

const CATEGORY_INCLUDE = [{
  model: Category,
  as: "category",
  attributes: ["id", "name"],
  required: true,
}];

export const getProducts = async (params = {}, { admin = false } = {}) => {
  const { page, limit, search, status, stock, categoryId } = params;

  const where = admin ? {} : { isActive: true };

  if (search && search.trim()) {
    const term = search.trim();
    where[Op.or] = [
      { name: { [Op.iLike]: `%${term}%` } },
      { sku: { [Op.iLike]: `%${term}%` } },
    ];
  }

  if (admin) {
    if (status === "active") where.isActive = true;
    else if (status === "inactive") where.isActive = false;
  }

  if (stock === "out") where.stock = 0;
  else if (stock === "low") where.stock = { [Op.gt]: 0, [Op.lte]: 15 };

  const numericCategoryId = Number(categoryId);
  if (Number.isInteger(numericCategoryId) && numericCategoryId > 0) {
    where.categoryId = numericCategoryId;
  }

  if (page || limit) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Product.findAndCountAll({
      attributes: PRODUCT_FIELDS,
      include: CATEGORY_INCLUDE,
      where,
      limit: limitNum,
      offset,
      order: [["createdAt", "DESC"]],
    });

    return {
      items: rows,
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limitNum) || 1,
        currentPage: pageNum,
        limit: limitNum,
      },
    };
  }

  return Product.findAll({
    attributes: PRODUCT_FIELDS,
    include: CATEGORY_INCLUDE,
    where,
    order: [["createdAt", "DESC"]],
  });
};

export const getProductById = (id, { admin = false } = {}) =>
  Product.findOne({
    attributes: PRODUCT_FIELDS,
    include: CATEGORY_INCLUDE,
    where: {
      id,
      ...(admin ? {} : { isActive: true }),
    },
  });

export const findProductBySku = (sku, excludeId) => {
  const where = { sku };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return Product.findOne({ where });
};

export const createProduct = async (payload) => {
  const product = await Product.create(payload);
  return getProductById(product.id, { admin: true });
};

export const updateProduct = async (product, payload) => {
  await product.update(payload);
  return getProductById(product.id, { admin: true });
};

export const deleteProduct = async (product) => {
  const [orderItemCount, cartItemCount] = await Promise.all([
    OrderItem.count({ where: { productId: product.id } }),
    CartItem.count({ where: { productId: product.id } }),
  ]);
  if (orderItemCount > 0 || cartItemCount > 0) {
    await product.update({ isActive: false });
    return { id: product.id, action: "deactivated" };
  }
  const id = product.id;
  await product.destroy();
  return { id, action: "deleted" };
};
