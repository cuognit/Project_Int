import { verifyAccessToken } from "../services/token.service.js";
import { User } from "../models/index.js";

// Xác thực access token và gắn thông tin người dùng hiện tại vào request.
export const authenticate = async (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Bạn cần đăng nhập để thực hiện thao tác này",
    });
  }

  try {
    const payload = verifyAccessToken(authorization.slice(7));
    const userId = Number(payload.sub);
    if (
      typeof payload !== "object" ||
      payload.type !== "access" ||
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      throw new Error("Invalid access token");
    }
    const user = await User.findByPk(userId, {
      attributes: ["id", "role", "isActive"],
    });
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Tài khoản không tồn tại hoặc đã bị khóa",
      });
    }
    req.user = { id: user.id, role: user.role };
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Access token không hợp lệ hoặc đã hết hạn",
    });
  }
};

// Chỉ cho phép tài khoản quản trị tiếp tục truy cập tài nguyên.
export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền thực hiện thao tác này",
    });
  }
  return next();
};
