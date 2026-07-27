import { col, fn, Op } from "sequelize";
import sequelize from "../config/database.js";
import {
  Cart,
  CartItem,
  Category,
  Product,
  User,
  Voucher,
  VoucherCategory,
  VoucherUsage,
  VoucherUser,
} from "../models/index.js";

const serviceError = (statusCode, message, code = null, details = {}) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  Object.assign(error, details);
  return error;
};

const uniqueIds = (values) => [...new Set(values.map(Number))];

const includeRelations = [
  { model: Category, as: "categories", attributes: ["id", "name"], through: { attributes: [] } },
  { model: User, as: "users", attributes: ["id", "fullName", "email"], through: { attributes: [] } },
];

export const getCartPricing = async (userId, { transaction, lock = false } = {}) => {
  const cart = await Cart.findOne({
    where: { userId, status: "ACTIVE" },
    transaction,
    ...(lock && transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  if (!cart) throw serviceError(409, "Giỏ hàng đang trống");

  const cartItems = await CartItem.findAll({
    where: { cartId: cart.id },
    order: [["id", "ASC"]],
    transaction,
    ...(lock && transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  if (!cartItems.length) throw serviceError(409, "Giỏ hàng đang trống");

  const items = [];
  let subtotal = 0;
  for (const cartItem of cartItems) {
    const product = await Product.findByPk(cartItem.productId, {
      transaction,
      ...(lock && transaction ? { lock: transaction.LOCK.UPDATE } : {}),
    });
    if (!product || !product.isActive) {
      throw serviceError(409, "Có sản phẩm đã ngừng kinh doanh");
    }
    const unitPrice = Number(product.price);
    const totalPrice = unitPrice * cartItem.quantity;
    subtotal += totalPrice;
    items.push({ cartItem, product, unitPrice, totalPrice });
  }
  return { cart, items, subtotal };
};

const getRelations = async (voucher, transaction) => {
  if (Array.isArray(voucher.categories) && Array.isArray(voucher.users)) {
    return { categories: voucher.categories, users: voucher.users };
  }
  const [categories, users] = await Promise.all([
    voucher.getCategories({ attributes: ["id", "name"], joinTableAttributes: [], transaction }),
    voucher.getUsers({ attributes: ["id", "fullName", "email"], joinTableAttributes: [], transaction }),
  ]);
  return { categories, users };
};

export const evaluateVoucher = async ({
  voucher,
  userId,
  items,
  subtotal,
  transaction,
  checkLimits = true,
  usageCounts = null,
}) => {
  const now = new Date();
  if (!voucher.isActive) throw serviceError(409, "Voucher đang tạm ngừng", "INACTIVE");
  if (now < voucher.startAt) {
    throw serviceError(409, "Voucher chưa đến thời gian sử dụng", "UPCOMING");
  }
  if (now > voucher.endAt) throw serviceError(409, "Voucher đã hết hạn", "EXPIRED");

  const { categories, users } = await getRelations(voucher, transaction);
  if (voucher.audience === "TARGETED" && !users.some((user) => user.id === userId)) {
    throw serviceError(403, "Voucher không dành cho tài khoản này", "NOT_ASSIGNED");
  }

  if (checkLimits) {
    const [totalUsed, userUsed] = usageCounts
      ? [
          usageCounts.totalUsed || 0,
          usageCounts.userUsed || 0,
        ]
      : await Promise.all([
          VoucherUsage.count({ where: { voucherId: voucher.id, status: "APPLIED" }, transaction }),
          VoucherUsage.count({
            where: { voucherId: voucher.id, userId, status: "APPLIED" },
            transaction,
          }),
        ]);
    if (voucher.totalUsageLimit !== null && totalUsed >= voucher.totalUsageLimit) {
      throw serviceError(409, "Voucher đã hết lượt sử dụng", "TOTAL_LIMIT_REACHED");
    }
    if (voucher.perUserLimit !== null && userUsed >= voucher.perUserLimit) {
      throw serviceError(409, "Bạn đã sử dụng hết lượt của voucher này", "USER_LIMIT_REACHED");
    }
  }

  const categoryIds = new Set(categories.map((category) => category.id));
  const eligibleSubtotal = voucher.scope === "ALL"
    ? subtotal
    : items.reduce(
        (sum, item) => sum + (categoryIds.has(item.product.categoryId) ? item.totalPrice : 0),
        0,
      );
  if (eligibleSubtotal <= 0) {
    throw serviceError(
      409,
      "Giỏ hàng không có sản phẩm thuộc phạm vi voucher",
      "CATEGORY_MISMATCH",
      { eligibleSubtotal },
    );
  }
  if (eligibleSubtotal < Number(voucher.minOrderAmount)) {
    const missingAmount = Number(voucher.minOrderAmount) - eligibleSubtotal;
    throw serviceError(
      409,
      `Cần mua thêm ${missingAmount.toLocaleString("vi-VN")}đ sản phẩm phù hợp`,
      "MIN_ORDER_NOT_MET",
      { eligibleSubtotal, missingAmount },
    );
  }

  let discountAmount = voucher.discountType === "FIXED"
    ? Number(voucher.discountValue)
    : eligibleSubtotal * Number(voucher.discountValue) / 100;
  if (voucher.discountType === "PERCENTAGE" && voucher.maxDiscountAmount !== null) {
    discountAmount = Math.min(discountAmount, Number(voucher.maxDiscountAmount));
  }
  discountAmount = Math.min(eligibleSubtotal, Math.round(discountAmount));

  return {
    voucher,
    categories,
    eligibleSubtotal,
    discountAmount,
    subtotal,
    totalAmount: Math.max(0, subtotal - discountAmount),
  };
};

const findVoucherByCode = async (code, { transaction, lock = false } = {}) => {
  const voucher = await Voucher.findOne({
    where: { code: { [Op.iLike]: code.trim() } },
    transaction,
    ...(lock && transaction ? { lock: transaction.LOCK.UPDATE } : {}),
  });
  if (!voucher) throw serviceError(404, "Mã voucher không tồn tại");
  return voucher;
};

export const validateVoucherForCart = async (userId, code, options = {}) => {
  const pricing = options.pricing || await getCartPricing(userId, options);
  const voucher = await findVoucherByCode(code, options);
  return evaluateVoucher({ voucher, userId, ...pricing, transaction: options.transaction });
};

export const getAvailableVouchers = async (userId, options = {}) => {
  const { transaction } = options;
  const pricing = await getCartPricing(userId, options);
  const vouchers = await Voucher.findAll({
    where: { isActive: true, endAt: { [Op.gte]: new Date() } },
    include: includeRelations,
    order: [["startAt", "ASC"], ["endAt", "ASC"]],
    transaction,
  });

  const ownedVouchers = vouchers.filter(
    (voucher) => voucher.audience === "ALL"
      || voucher.users.some((user) => user.id === userId),
  );
  const voucherIds = ownedVouchers.map((voucher) => voucher.id);
  const usageAttributes = ["voucherId", [fn("COUNT", col("id")), "usageCount"]];
  const [totalUsageRows, userUsageRows] = voucherIds.length
    ? await Promise.all([
        VoucherUsage.findAll({
          attributes: usageAttributes,
          where: { voucherId: voucherIds, status: "APPLIED" },
          group: ["voucherId"],
          raw: true,
          transaction,
        }),
        VoucherUsage.findAll({
          attributes: usageAttributes,
          where: { voucherId: voucherIds, userId, status: "APPLIED" },
          group: ["voucherId"],
          raw: true,
          transaction,
        }),
      ])
    : [[], []];
  const totalUsage = new Map(
    totalUsageRows.map((row) => [Number(row.voucherId), Number(row.usageCount)]),
  );
  const userUsage = new Map(
    userUsageRows.map((row) => [Number(row.voucherId), Number(row.usageCount)]),
  );

  return Promise.all(ownedVouchers.map(async (voucher) => {
    try {
      const result = await evaluateVoucher({
        voucher,
        userId,
        ...pricing,
        usageCounts: {
          totalUsed: totalUsage.get(voucher.id) || 0,
          userUsed: userUsage.get(voucher.id) || 0,
        },
        transaction,
      });
      return { ...toPreview(result), isApplicable: true, unavailableCode: null, unavailableReason: null };
    } catch (error) {
      return {
        ...toVoucherSummary(voucher),
        categories: voucher.categories,
        eligibleSubtotal: error.eligibleSubtotal ?? 0,
        discountAmount: 0,
        subtotal: pricing.subtotal,
        totalAmount: pricing.subtotal,
        isApplicable: false,
        unavailableCode: error.code || "NOT_APPLICABLE",
        unavailableReason: error.message || "Voucher không áp dụng được",
        missingAmount: error.missingAmount ?? null,
      };
    }
  }));
};

const toVoucherSummary = (voucher) => ({
  id: voucher.id,
  code: voucher.code,
  name: voucher.name,
  description: voucher.description,
  discountType: voucher.discountType,
  discountValue: Number(voucher.discountValue),
  maxDiscountAmount: voucher.maxDiscountAmount === null ? null : Number(voucher.maxDiscountAmount),
  minOrderAmount: Number(voucher.minOrderAmount),
  scope: voucher.scope,
  startAt: voucher.startAt,
  endAt: voucher.endAt,
});

export const toPreview = ({ voucher, categories, eligibleSubtotal, discountAmount, subtotal, totalAmount }) => ({
  ...toVoucherSummary(voucher),
  categories,
  eligibleSubtotal,
  discountAmount,
  subtotal,
  totalAmount,
});

const validateReferences = async (payload, transaction) => {
  const categoryIds = uniqueIds(payload.scope === "CATEGORIES" ? payload.categoryIds : []);
  const userIds = uniqueIds(payload.audience === "TARGETED" ? payload.userIds : []);
  const [categoryCount, userCount] = await Promise.all([
    Category.count({ where: { id: categoryIds }, transaction }),
    User.count({ where: { id: userIds }, transaction }),
  ]);
  if (categoryCount !== categoryIds.length) throw serviceError(400, "Có danh mục không tồn tại");
  if (userCount !== userIds.length) throw serviceError(400, "Có người dùng không tồn tại");
  return { categoryIds, userIds };
};

const ensureUniqueCode = async (code, excludeId, transaction) => {
  const duplicate = await Voucher.findOne({
    where: {
      code: { [Op.iLike]: code },
      ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
    },
    transaction,
  });
  if (duplicate) throw serviceError(409, "Mã voucher đã tồn tại");
};

const persistVoucher = async (voucher, payload, transaction) => {
  const { categoryIds, userIds } = await validateReferences(payload, transaction);
  await ensureUniqueCode(payload.code, voucher?.id, transaction);

  if (voucher) {
    const appliedCount = await VoucherUsage.count({
      where: { voucherId: voucher.id, status: "APPLIED" },
      transaction,
    });
    if (payload.totalUsageLimit !== null && payload.totalUsageLimit < appliedCount) {
      throw serviceError(409, "Tổng lượt không thể nhỏ hơn số lượt đã sử dụng");
    }
    if (payload.perUserLimit !== null) {
      const [rows] = await sequelize.query(
        `SELECT COALESCE(MAX(user_count), 0)::int AS max_count
         FROM (
           SELECT COUNT(*) AS user_count
           FROM voucher_usages
           WHERE voucher_id = :voucherId AND status = 'APPLIED'
           GROUP BY user_id
         ) usage_counts`,
        { replacements: { voucherId: voucher.id }, transaction },
      );
      if (payload.perUserLimit < Number(rows[0]?.max_count || 0)) {
        throw serviceError(409, "Lượt mỗi user không thể nhỏ hơn số lượt đã sử dụng");
      }
    }
    await voucher.update(payload, { transaction });
  } else {
    voucher = await Voucher.create(payload, { transaction });
  }
  await Promise.all([
    voucher.setCategories(categoryIds, { transaction }),
    voucher.setUsers(userIds, { transaction }),
  ]);
  return voucher.id;
};

export const createVoucher = (payload) => sequelize.transaction(
  async (transaction) => getAdminVoucherById(
    await persistVoucher(null, payload, transaction),
    transaction,
  ),
);

export const updateVoucher = (id, payload) => sequelize.transaction(async (transaction) => {
  const voucher = await Voucher.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
  if (!voucher) throw serviceError(404, "Không tìm thấy voucher");
  return getAdminVoucherById(
    await persistVoucher(voucher, payload, transaction),
    transaction,
  );
});

export const getAdminVoucherById = async (id, transaction) => {
  const voucher = await Voucher.findByPk(id, { include: includeRelations, transaction });
  if (!voucher) throw serviceError(404, "Không tìm thấy voucher");
  const usageCount = await VoucherUsage.count({
    where: { voucherId: id, status: "APPLIED" },
    transaction,
  });
  return { ...voucher.toJSON(), usageCount };
};

export const listAdminVouchers = async ({
  search = "",
  status = "all",
  page = 1,
  limit = 20,
} = {}) => {
  const where = {};
  if (search.trim()) {
    where[Op.or] = [
      { code: { [Op.iLike]: `%${search.trim()}%` } },
      { name: { [Op.iLike]: `%${search.trim()}%` } },
    ];
  }
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;
  const pageNumber = Math.max(1, Number(page) || 1);
  const limitNumber = Math.min(50, Math.max(1, Number(limit) || 20));
  const { count, rows: vouchers } = await Voucher.findAndCountAll({
    where,
    include: includeRelations,
    distinct: true,
    limit: limitNumber,
    offset: (pageNumber - 1) * limitNumber,
    order: [["createdAt", "DESC"]],
  });
  const items = await Promise.all(vouchers.map(async (voucher) => ({
    ...voucher.toJSON(),
    usageCount: await VoucherUsage.count({
      where: { voucherId: voucher.id, status: "APPLIED" },
    }),
  })));
  return {
    items,
    pagination: {
      page: pageNumber,
      limit: limitNumber,
      totalItems: count,
      totalPages: Math.max(1, Math.ceil(count / limitNumber)),
    },
  };
};

export const setVoucherStatus = async (id, isActive) => {
  const voucher = await Voucher.findByPk(id);
  if (!voucher) throw serviceError(404, "Không tìm thấy voucher");
  await voucher.update({ isActive });
  return getAdminVoucherById(id);
};

export const releaseVoucherUsage = async (orderId, transaction) => {
  const usage = await VoucherUsage.findOne({
    where: { orderId, status: "APPLIED" },
    transaction,
    lock: transaction.LOCK.UPDATE,
  });
  if (usage) {
    await usage.update({ status: "RELEASED", releasedAt: new Date() }, { transaction });
  }
};
