import bcrypt from "bcryptjs";
import { Op, UniqueConstraintError } from "sequelize";
import sequelize from "../config/database.js";
import { RefreshSession, User } from "../models/index.js";
import {
  normalizeGoogleFullName,
  verifyGoogleToken,
} from "./googleAuth.service.js";
import {
  ACCESS_TOKEN_TTL_SECONDS,
  createAccessToken,
  createAuthTokens,
  hashRefreshToken,
  verifyRefreshToken,
} from "./token.service.js";

const BCRYPT_ROUNDS = 12;

const publicUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  address: user.address,
  role: user.role,
  isActive: user.isActive,
});

const invalidCredentials = () => {
  const error = new Error("Email hoặc mật khẩu không chính xác");
  error.statusCode = 401;
  return error;
};

const invalidRefreshToken = () => {
  const error = new Error("Phiên đăng nhập không hợp lệ hoặc đã hết hạn");
  error.statusCode = 401;
  return error;
};

const issueUserSession = async (user, transaction = null) => {
  await RefreshSession.destroy({
    where: {
      userId: user.id,
      expiresAt: { [Op.lt]: new Date() },
    },
    ...(transaction ? { transaction } : {}),
  });

  const tokens = createAuthTokens(user);
  await RefreshSession.create(
    {
      id: tokens.refreshId,
      userId: user.id,
      tokenHash: hashRefreshToken(tokens.refreshToken),
      expiresAt: tokens.refreshExpiresAt,
    },
    transaction ? { transaction } : {},
  );

  return {
    user: publicUser(user),
    accessToken: tokens.accessToken,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshToken: tokens.refreshToken,
  };
};

// Tạo tài khoản mới và phát hành bộ token đăng nhập ban đầu.
export const registerUser = async (payload) => {
  const { fullName, email, password, phone, address } = payload;
  const existingUser = await User.findOne({
    where: { email: { [Op.iLike]: email } },
  });

  if (existingUser) {
    const error = new Error("Email đã được đăng ký trên hệ thống");
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

  try {
    const user = await User.create({
      fullName,
      email,
      password: hashedPassword,
      phone: phone || null,
      address: address || null,
      role: "customer",
    });
    return publicUser(user);
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      const duplicateError = new Error("Email đã được đăng ký trên hệ thống");
      duplicateError.statusCode = 409;
      throw duplicateError;
    }
    throw error;
  }
};

// Xác minh email, mật khẩu và phát hành phiên đăng nhập mới.
export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({
    where: { email: { [Op.iLike]: email } },
  });

  if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
    throw invalidCredentials();
  }
  if (!user.isActive) {
    const error = new Error("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên");
    error.statusCode = 403;
    throw error;
  }

  return issueUserSession(user);
};

// Xác minh Google credential rồi đăng nhập hoặc tạo người dùng tương ứng.
export const loginWithGoogle = async (credential) => {
  const googlePayload = await verifyGoogleToken(credential);
  const { sub, email, name } = googlePayload;
  const normalizedEmail = email.toLowerCase();

  const transaction = await sequelize.transaction();

  try {
    let user = await User.findOne({
      where: { googleSub: sub },
      transaction,
    });

    if (user) {
      if (!user.isActive) {
        const error = new Error("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên");
        error.statusCode = 403;
        throw error;
      }
    } else {
      user = await User.findOne({
        where: { email: { [Op.iLike]: normalizedEmail } },
        transaction,
      });

      if (user) {
        if (user.googleSub && user.googleSub !== sub) {
          const error = new Error("Email này đã được liên kết với một tài khoản Google khác");
          error.statusCode = 409;
          throw error;
        }

        if (!user.isActive) {
          const error = new Error("Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên");
          error.statusCode = 403;
          throw error;
        }

        user.googleSub = sub;
        await user.save({ transaction });
      } else {
        const fullName = normalizeGoogleFullName(name, normalizedEmail);
        user = await User.create(
          {
            fullName,
            email: normalizedEmail,
            password: null,
            googleSub: sub,
            role: "customer",
            isActive: true,
          },
          { transaction },
        );
      }
    }

    const sessionData = await issueUserSession(user, transaction);
    await transaction.commit();
    return sessionData;
  } catch (error) {
    await transaction.rollback();
    if (error instanceof UniqueConstraintError) {
      const conflictError = new Error(
        "Email hoặc tài khoản Google này đang được liên kết bởi một thao tác khác",
      );
      conflictError.statusCode = 409;
      throw conflictError;
    }
    throw error;
  }
};

// Luân chuyển refresh token hợp lệ và cấp lại access token.
export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) throw invalidRefreshToken();

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw invalidRefreshToken();
  }

  if (
    typeof payload !== "object" ||
    payload.type !== "refresh" ||
    !payload.jti ||
    !payload.sub
  ) {
    throw invalidRefreshToken();
  }

  const session = await RefreshSession.findOne({
    where: {
      id: payload.jti,
      userId: payload.sub,
      tokenHash: hashRefreshToken(refreshToken),
      revokedAt: null,
      expiresAt: { [Op.gt]: new Date() },
    },
    include: [{
      model: User,
      as: "user",
      required: true,
    }],
  });

  if (!session?.user || !session.user.isActive) throw invalidRefreshToken();

  return {
    user: publicUser(session.user),
    accessToken: createAccessToken(session.user),
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
};

// Thu hồi phiên đăng nhập gắn với refresh token.
export const logoutUser = async (refreshToken) => {
  if (!refreshToken) return;
  await RefreshSession.update(
    { revokedAt: new Date() },
    {
      where: {
        tokenHash: hashRefreshToken(refreshToken),
        revokedAt: null,
      },
    },
  );
};
