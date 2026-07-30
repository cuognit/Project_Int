import sequelize from "../config/database.js";
import { Cart, CartItem, Product } from "../models/index.js";

const PRODUCT_ATTRIBUTES = [
  "id", "name", "sku", "description", "price",
  "stock", "imageUrl", "isActive",
];

const serviceError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const includeItems = [{
  model: CartItem,
  as: "items",
  include: [{
    model: Product,
    as: "product",
    attributes: PRODUCT_ATTRIBUTES,
  }],
}];

const serializeCart = (cart) => {
  if (!cart) {
    return {
      id: null,
      status: "ACTIVE",
      items: [],
      totalQuantity: 0,
      totalAmount: 0,
    };
  }

  const items = cart.items.map((item) => ({
    id: item.id,
    quantity: item.quantity,
    product: item.product,
  }));

  return {
    id: cart.id,
    status: cart.status,
    items,
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
    totalAmount: items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    ),
  };
};

// Lấy hoặc khởi tạo giỏ hàng và chuẩn hóa dữ liệu trả về.
export const getCart = async (userId) => {
  const cart = await Cart.findOne({
    where: { userId, status: "ACTIVE" },
    include: includeItems,
    order: [[{ model: CartItem, as: "items" }, "createdAt", "ASC"]],
  });
  return serializeCart(cart);
};

const getAvailableProduct = async (productId, transaction) => {
  const product = await Product.findByPk(productId, { transaction });
  if (!product) throw serviceError(404, "Không tìm thấy sản phẩm");
  if (!product.isActive) {
    throw serviceError(409, "Sản phẩm đã ngừng kinh doanh");
  }
  if (product.stock <= 0) throw serviceError(409, "Sản phẩm đã hết hàng");
  return product;
};

const getOrCreateLockedCart = async (userId, transaction) => {
  const [cart] = await Cart.findOrCreate({
    where: { userId, status: "ACTIVE" },
    defaults: { userId, status: "ACTIVE" },
    transaction,
  });
  return Cart.findByPk(cart.id, {
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
};

// Thêm sản phẩm vào giỏ trong transaction và kiểm tra tồn kho.
export const addItem = async (userId, { productId, quantity }) => {
  await sequelize.transaction(async (transaction) => {
    const product = await getAvailableProduct(productId, transaction);
    const cart = await getOrCreateLockedCart(userId, transaction);
    const item = await CartItem.findOne({
      where: { cartId: cart.id, productId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const nextQuantity = (item?.quantity || 0) + quantity;
    if (nextQuantity > product.stock) {
      throw serviceError(409, `Chỉ còn ${product.stock} sản phẩm trong kho`);
    }
    if (item) await item.update({ quantity: nextQuantity }, { transaction });
    else {
      await CartItem.create(
        { cartId: cart.id, productId, quantity },
        { transaction },
      );
    }
  });
  return getCart(userId);
};

// Cập nhật số lượng sản phẩm trong giỏ với khóa dữ liệu phù hợp.
export const updateItem = async (userId, productId, quantity) => {
  await sequelize.transaction(async (transaction) => {
    const product = await getAvailableProduct(productId, transaction);
    const cart = await Cart.findOne({
      where: { userId, status: "ACTIVE" },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!cart) throw serviceError(404, "Không tìm thấy giỏ hàng");
    const item = await CartItem.findOne({
      where: { cartId: cart.id, productId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!item) throw serviceError(404, "Sản phẩm không có trong giỏ hàng");
    if (quantity > product.stock) {
      throw serviceError(409, `Chỉ còn ${product.stock} sản phẩm trong kho`);
    }
    await item.update({ quantity }, { transaction });
  });
  return getCart(userId);
};

// Xóa sản phẩm khỏi giỏ hàng của người dùng.
export const removeItem = async (userId, productId) => {
  await sequelize.transaction(async (transaction) => {
    const cart = await Cart.findOne({
      where: { userId, status: "ACTIVE" },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!cart) throw serviceError(404, "Không tìm thấy giỏ hàng");
    const deleted = await CartItem.destroy({
      where: { cartId: cart.id, productId },
      transaction,
    });
    if (!deleted) throw serviceError(404, "Sản phẩm không có trong giỏ hàng");
  });
  return getCart(userId);
};
