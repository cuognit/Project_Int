import assert from "node:assert/strict";
import test from "node:test";
import { Product, OrderItem, CartItem } from "../../src/models/index.js";
import {
  deleteProduct,
  findProductBySku,
  getProductById,
  getProducts,
} from "../../src/services/product.service.js";

test("getProducts - Lọc sản phẩm isActive=true đối với khách hàng (non-admin)", async () => {
  const origFindAll = Product.findAll;
  let passedWhere = null;

  Product.findAll = async (options) => {
    passedWhere = options.where;
    return [{ id: 1, name: "Sản phẩm A", isActive: true }];
  };

  try {
    const list = await getProducts({}, { admin: false });
    assert.equal(list.length, 1);
    assert.equal(passedWhere.isActive, true);
  } finally {
    Product.findAll = origFindAll;
  }
});

test("findProductBySku - Tìm kiếm sản phẩm theo mã SKU", async () => {
  const origFindOne = Product.findOne;
  Product.findOne = async () => ({ id: 5, sku: "SKU-001" });

  try {
    const found = await findProductBySku("SKU-001");
    assert.equal(found.id, 5);
    assert.equal(found.sku, "SKU-001");
  } finally {
    Product.findOne = origFindOne;
  }
});

test("deleteProduct - Chuyển sang trạng thái ngắt kinh doanh (deactivated) nếu sản phẩm đã có đơn hàng/giỏ hàng", async () => {
  const origOrderCount = OrderItem.count;
  const origCartCount = CartItem.count;

  OrderItem.count = async () => 1;
  CartItem.count = async () => 0;

  let deactivated = false;
  const mockProduct = {
    id: 10,
    update: async (data) => {
      if (data.isActive === false) deactivated = true;
    },
  };

  try {
    const res = await deleteProduct(mockProduct);
    assert.equal(res.action, "deactivated");
    assert.equal(deactivated, true);
  } finally {
    OrderItem.count = origOrderCount;
    CartItem.count = origCartCount;
  }
});
