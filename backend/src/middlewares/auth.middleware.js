import { verifyAccessToken } from "../services/token.service.js";

export const authenticate = (req, res, next) => {
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
    req.user = { id: userId, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      message: "Access token không hợp lệ hoặc đã hết hạn",
    });
  }
};

export const requireAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền thực hiện thao tác này",
    });
  }
  return next();
};

