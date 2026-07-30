import assert from "node:assert/strict";
import test from "node:test";
import sequelize from "../../src/config/database.js";
import { DEFAULT_CATEGORY_NAME } from "../../src/database/productCategory.migration.js";
import { Category, Product, VoucherCategory } from "../../src/models/index.js";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../../src/services/category.service.js";

test("getCategories - Trả về danh sách danh mục kèm cờ isDefault và số lượng sản phẩm", async () => {
  const originalFindAll = Category.findAll;
  Category.findAll = async () => [
    { id: 1, name: DEFAULT_CATEGORY_NAME, activeProductCount: "5" },
    { id: 2, name: "Áo nam", activeProductCount: "10" },
  ];

  try {
    const list = await getCategories();
    assert.equal(list.length, 2);
    assert.equal(list[0].isDefault, true);
    assert.equal(list[0].activeProductCount, 5);
    assert.equal(list[1].isDefault, false);
    assert.equal(list[1].activeProductCount, 10);
  } finally {
    Category.findAll = originalFindAll;
  }
});

test("createCategory - Báo lỗi 409 khi tên danh mục đã tồn tại", async () => {
  const originalFindOne = Category.findOne;
  Category.findOne = async () => ({ id: 1, name: "Thời trang" });

  try {
    await assert.rejects(
      createCategory("Thời trang"),
      (err) => err.statusCode === 409,
    );
  } finally {
    Category.findOne = originalFindOne;
  }
});

test("updateCategory - Báo lỗi 409 khi cố đổi tên danh mục mặc định", async () => {
  const originalFindByPk = Category.findByPk;
  Category.findByPk = async () => ({
    id: 1,
    name: DEFAULT_CATEGORY_NAME,
    save: async () => {},
  });

  try {
    await assert.rejects(
      updateCategory(1, "Tên Mới"),
      (err) => err.statusCode === 409 && err.message.includes("mặc định"),
    );
  } finally {
    Category.findByPk = originalFindByPk;
  }
});

test("deleteCategory - Chuyển sản phẩm sang danh mục mặc định và xóa danh mục thành công", async () => {
  const originalTransaction = sequelize.transaction;
  const originalFindByPk = Category.findByPk;
  const originalVoucherCount = VoucherCategory.count;
  const originalFindOne = Category.findOne;
  const originalProductUpdate = Product.update;

  sequelize.transaction = async (cb) => cb({ LOCK: { UPDATE: "UPDATE" } });
  Category.findByPk = async () => ({
    id: 5,
    name: "Áo khoác",
    destroy: async () => {},
  });
  VoucherCategory.count = async () => 0;
  Category.findOne = async () => ({ id: 1, name: DEFAULT_CATEGORY_NAME });
  Product.update = async () => [3];

  try {
    const result = await deleteCategory(5);
    assert.equal(result.id, 5);
    assert.equal(result.movedProducts, 3);
  } finally {
    sequelize.transaction = originalTransaction;
    Category.findByPk = originalFindByPk;
    VoucherCategory.count = originalVoucherCount;
    Category.findOne = originalFindOne;
    Product.update = originalProductUpdate;
  }
});
