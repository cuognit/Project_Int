import { Op } from "sequelize";
import { CartItem, OrderItem, Product } from "../models/index.js";

const PRODUCT_FIELDS = [
  "id", "name", "sku", "description", "price", "stock",
  "imageUrl", "isActive", "createdAt", "updatedAt",
];

export const getProducts = async (params = {}) => {
  const { page, limit, search, status, stock } = params;

  const where = {};

  if (search && search.trim()) {
    const term = search.trim();
    where[Op.or] = [
      { name: { [Op.iLike]: `%${term}%` } },
      { sku: { [Op.iLike]: `%${term}%` } },
    ];
  }

  if (status === "active") where.isActive = true;
  else if (status === "inactive") where.isActive = false;

  if (stock === "out") where.stock = 0;
  else if (stock === "low") where.stock = { [Op.gt]: 0, [Op.lte]: 15 };

  if (page || limit) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const offset = (pageNum - 1) * limitNum;

    const { count, rows } = await Product.findAndCountAll({
      attributes: PRODUCT_FIELDS,
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
    where,
    order: [["createdAt", "DESC"]],
  });
};

export const getProductById = (id) =>
  Product.findByPk(id, { attributes: PRODUCT_FIELDS });

export const findProductBySku = (sku, excludeId) => {
  const where = { sku };
  if (excludeId) where.id = { [Op.ne]: excludeId };
  return Product.findOne({ where });
};

export const createProduct = (payload) => Product.create(payload);
export const updateProduct = (product, payload) => product.update(payload);

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
