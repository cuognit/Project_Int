import * as userService from "../services/user.service.js";
import { updateUserAccessSchema } from "../validators/user.validator.js";
import { disconnectUserSessions } from "../socket/notification.gateway.js";

// Lấy danh sách người dùng dành cho quản trị viên.
export const listUsers = async (req, res, next) => {
  try {
    const users = await userService.getUsers();
    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy thông tin chi tiết của một người dùng.
export const getUserDetail = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

// Lấy danh sách người dùng đã phát sinh đơn hàng.
export const listUserHaveOrders = async (req, res, next) => {
  try {
    const users = await userService.getAllUserHaveOrders();

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Lỗi lấy user có đơn:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Lấy lịch sử đơn hàng của một người dùng cụ thể.
export const listOrdersByUserId = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const orders = await userService.getOrdersByUserId(userId);

    return res.status(200).json({
      success: true,
      data: orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Trả về hồ sơ của người dùng đang đăng nhập.
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await userService.getUserById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người dùng",
      });
    }
    return res.status(200).json({
      success: true,
      data: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật thông tin hồ sơ của người dùng hiện tại.
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { fullName, phone, address } = req.body;
    const updatedUser = await userService.updateUserProfile(userId, { fullName, phone, address });
    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin cá nhân thành công",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Đổi mật khẩu sau khi xác minh mật khẩu hiện tại.
export const changePassword = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập mật khẩu hiện tại và mật khẩu mới",
      });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Mật khẩu mới phải có ít nhất 8 ký tự",
      });
    }
    const result = await userService.changeUserPassword(userId, currentPassword, newPassword);
    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    return res.status(error.statusCode || 400).json({
      success: false,
      message: error.message || "Đổi mật khẩu thất bại",
    });
  }
};

// Cho phép quản trị viên cập nhật hồ sơ người dùng.
export const adminUpdateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { fullName, phone, address } = req.body;
    const updatedUser = await userService.adminUpdateUser(userId, { fullName, phone, address });
    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin người dùng thành công",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Cập nhật vai trò hoặc trạng thái truy cập của người dùng.
export const updateUserAccess = async (req, res, next) => {
  const validation = updateUserAccessSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      success: false,
      message: "Dữ liệu phân quyền không hợp lệ",
    });
  }

  try {
    const result = await userService.updateUserAccess(
      req.user.id,
      req.params.userId,
      validation.data,
    );
    if (result.accessChanged) {
      disconnectUserSessions(result.user.id);
    }
    return res.status(200).json({
      success: true,
      message: "Cập nhật quyền và trạng thái tài khoản thành công",
      data: result.user,
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }
    return next(error);
  }
};
