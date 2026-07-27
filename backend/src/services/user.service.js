
import bcrypt from "bcryptjs";
import { fn, col, literal } from "sequelize";
import { User, Order, RefreshSession } from "../models/index.js";
import sequelize from "../config/database.js";

export const getUsers = async () => {
  const users = await User.findAll({
    attributes: [
      "id",
      "fullName",
      "email",
      "phone",
      "address",
      "role",
      "isActive",
      [fn("COUNT", col("orders.id")), "totalOrders"],
      [
        fn(
          "COALESCE",
          fn(
            "SUM",
            literal(
              "CASE WHEN orders.status = 'COMPLETED' THEN orders.total_amount ELSE 0 END"
            )
          ),
          0
        ),
        "totalSpend",
      ],
    ],
    include: [
      {
        model: Order,
        as: "orders",
        attributes: [],
        required: false,
      },
    ],
    group: [
      "User.id",
      "User.full_name",
      "User.email",
      "User.phone",
      "User.address",
      "User.role",
      "User.is_active",
    ],
    order: [["id", "ASC"]],
    raw: true,
  });

  return users.map((user) => ({
    ...user,
    totalOrders: Number(user.totalOrders || 0),
    totalSpend: Number(user.totalSpend || 0),
  }));
};

export const getUserById = async (id) => {
  return User.findByPk(id, {
    attributes: { exclude: ["password"] },
  });
};

export const getAllUserHaveOrders = async () => {
  const users = await User.findAll({
    attributes: [
      "id",
      "fullName",
      "email",
      "phone",
      [fn("COUNT", col("orders.id")), "totalOrders"],
    ],

    include: [
      {
        model: Order,
        as: "orders",
        attributes: [],
        required: true,
      },
    ],

    group: [
      "User.id",
      "User.full_name",
      "User.email",
      "User.phone",
    ],

    order: [[fn("COUNT", col("orders.id")), "DESC"]],

    raw: true,
  });

  return users.map((user) => ({
    ...user,
    totalOrders: Number(user.totalOrders),
  }));
};


export const getOrdersByUserId = async (userId) => {
  const orders = await Order.findAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
  });

  return orders;
};

export const updateUserProfile = async (userId, { fullName, phone, address }) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("Không tìm thấy người dùng");
    error.statusCode = 404;
    throw error;
  }

  if (fullName !== undefined) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;

  await user.save();

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    isActive: user.isActive,
  };
};

export const changeUserPassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("Không tìm thấy người dùng");
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    const error = new Error("Mật khẩu hiện tại không chính xác");
    error.statusCode = 400;
    throw error;
  }

  const BCRYPT_ROUNDS = 12;
  user.password = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await user.save();

  return { success: true, message: "Đổi mật khẩu thành công" };
};

export const adminUpdateUser = async (userId, { fullName, phone, address }) => {
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error("Không tìm thấy người dùng");
    error.statusCode = 404;
    throw error;
  }

  if (fullName !== undefined) user.fullName = fullName;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  await user.save();

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
    isActive: user.isActive,
  };
};

export const updateUserAccess = async (
  actorUserId,
  userId,
  { role, isActive },
) => {
  const numericUserId = Number(userId);
  if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
    const error = new Error("Mã người dùng không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  if (
    numericUserId === actorUserId &&
    (role !== "admin" || isActive !== true)
  ) {
    const error = new Error(
      "Bạn không thể tự khóa tài khoản hoặc tự hạ quyền quản trị",
    );
    error.statusCode = 409;
    throw error;
  }

  return sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(numericUserId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!user) {
      const error = new Error("Không tìm thấy người dùng");
      error.statusCode = 404;
      throw error;
    }

    const accessChanged = user.role !== role || user.isActive !== isActive;
    user.role = role;
    user.isActive = isActive;
    await user.save({ transaction });

    if (accessChanged) {
      await RefreshSession.update(
        { revokedAt: new Date() },
        {
          where: { userId: numericUserId, revokedAt: null },
          transaction,
        },
      );
    }

    return {
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        isActive: user.isActive,
      },
      accessChanged,
    };
  });
};
