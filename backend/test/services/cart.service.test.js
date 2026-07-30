import assert from "node:assert/strict";
import test from "node:test";
import sequelize from "../../src/config/database.js";
import { Cart, CartItem, Product } from "../../src/models/index.js";
import {
  addItem,
  getCart,
  removeItem,
  updateItem,
} from "../../src/services/cart.service.js";

test("getCart - Trả về giỏ hàng trống khi người dùng chưa có giỏ hàng active", async () => {
  const originalFindOne = Cart.findOne;
  Cart.findOne = async () => null;

  try {
    const cart = await getCart(1);
    assert.equal(cart.id, null);
    assert.equal(cart.status, "ACTIVE");
    assert.deepEqual(cart.items, []);
    assert.equal(cart.totalQuantity, 0);
    assert.equal(cart.totalAmount, 0);
  } finally {
    Cart.findOne = originalFindOne;
  }
});

test("getCart - Tính toán tổng số lượng và tổng tiền chính xác", async () => {
  const originalFindOne = Cart.findOne;
  Cart.findOne = async () => ({
    id: 10,
    status: "ACTIVE",
    items: [
      {
        id: 101,
        quantity: 2,
        product: { id: 1, name: "Sp 1", price: "50000" },
      },
      {
        id: 102,
        quantity: 1,
        product: { id: 2, name: "Sp 2", price: "30000" },
      },
    ],
  });

  try {
    const cart = await getCart(1);
    assert.equal(cart.id, 10);
    assert.equal(cart.totalQuantity, 3);
    assert.equal(cart.totalAmount, 130000);
  } finally {
    Cart.findOne = originalFindOne;
  }
});

test("addItem - Báo lỗi 404 khi sản phẩm không tồn tại", async () => {
  const originalTransaction = sequelize.transaction;
  const originalFindByPk = Product.findByPk;

  sequelize.transaction = async (cb) => cb({ LOCK: { UPDATE: "UPDATE" } });
  Product.findByPk = async () => null;

  try {
    await assert.rejects(
      addItem(1, { productId: 999, quantity: 1 }),
      (err) => err.statusCode === 404,
    );
  } finally {
    sequelize.transaction = originalTransaction;
    Product.findByPk = originalFindByPk;
  }
});

test("addItem - Báo lỗi 409 khi số lượng yêu cầu vượt quá tồn kho", async () => {
  const originalTransaction = sequelize.transaction;
  const originalFindByPk = Product.findByPk;
  const originalFindOrCreate = Cart.findOrCreate;
  const originalCartFindByPk = Cart.findByPk;
  const originalCartItemFindOne = CartItem.findOne;

  sequelize.transaction = async (cb) => cb({ LOCK: { UPDATE: "UPDATE" } });
  Product.findByPk = async () => ({ id: 1, isActive: true, stock: 2 });
  Cart.findOrCreate = async () => [{ id: 10 }];
  Cart.findByPk = async () => ({ id: 10 });
  CartItem.findOne = async () => ({ quantity: 2 });

  try {
    await assert.rejects(
      addItem(1, { productId: 1, quantity: 1 }),
      (err) => err.statusCode === 409,
    );
  } finally {
    sequelize.transaction = originalTransaction;
    Product.findByPk = originalFindByPk;
    Cart.findOrCreate = originalFindOrCreate;
    Cart.findByPk = originalCartFindByPk;
    CartItem.findOne = originalCartItemFindOne;
  }
});
