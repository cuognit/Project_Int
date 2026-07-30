import * as authService from "../services/auth.service.js";
import { REFRESH_TOKEN_TTL_SECONDS } from "../services/token.service.js";
import {
  formatValidationErrors,
  googleLoginSchema,
  loginSchema,
  registerSchema,
} from "../validators/auth.validator.js";


const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: REFRESH_TOKEN_TTL_SECONDS * 1000,
  path: "/api/auth",
});

const clearRefreshCookie = (res) => {
  const { maxAge: _maxAge, ...options } = refreshCookieOptions();
  res.clearCookie("refreshToken", options);
};

// Đăng nhập bằng email, lưu refresh token và trả về phiên người dùng.
export const login = async (req, res, next) => {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu đăng nhập không hợp lệ",
        errors: formatValidationErrors(validation.error.issues),
      });
    }

    const data = await authService.loginUser(validation.data);
    const { refreshToken, ...clientData } = data;
    res.cookie("refreshToken", refreshToken, refreshCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Đăng nhập thành công",
      data: clientData,
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

// Đăng nhập hoặc tạo tài khoản từ thông tin xác thực Google.
export const googleLogin = async (req, res, next) => {
  try {
    const validation = googleLoginSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu đăng nhập Google không hợp lệ",
        errors: formatValidationErrors(validation.error.issues),
      });
    }

    const data = await authService.loginWithGoogle(validation.data.credential);
    const { refreshToken, ...clientData } = data;
    res.cookie("refreshToken", refreshToken, refreshCookieOptions());

    return res.status(200).json({
      success: true,
      message: "Đăng nhập bằng Google thành công",
      data: clientData,
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


// Đăng ký tài khoản mới và khởi tạo phiên đăng nhập.
export const register = async (req, res, next) => {
  try {
    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu đăng ký không hợp lệ",
        errors: formatValidationErrors(validation.error.issues),
      });
    }

    const data = await authService.registerUser(validation.data);
    return res.status(201).json({
      success: true,
      message: "Đăng ký tài khoản thành công",
      data,
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

// Làm mới access token từ refresh token trong cookie.
export const refresh = async (req, res, next) => {
  try {
    const data = await authService.refreshAccessToken(req.cookies?.refreshToken);
    return res.status(200).json({
      success: true,
      message: "Làm mới access token thành công",
      data,
    });
  } catch (error) {
    if (error.statusCode === 401) {
      clearRefreshCookie(res);
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }
    return next(error);
  }
};

// Thu hồi refresh token và xóa cookie phiên đăng nhập.
export const logout = async (req, res, next) => {
  const refreshToken = req.cookies?.refreshToken;
  clearRefreshCookie(res);
  try {
    await authService.logoutUser(refreshToken);
    return res.status(200).json({
      success: true,
      message: "Đăng xuất thành công",
    });
  } catch (error) {
    return next(error);
  }
};
