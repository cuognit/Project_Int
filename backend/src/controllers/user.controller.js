import * as userService from "../services/user.service.js";

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
      },
    });
  } catch (error) {
    next(error);
  }
};

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

export const adminUpdateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { fullName, phone, address, role } = req.body;
    const updatedUser = await userService.adminUpdateUser(userId, { fullName, phone, address, role });
    return res.status(200).json({
      success: true,
      message: "Cập nhật thông tin người dùng thành công",
      data: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

