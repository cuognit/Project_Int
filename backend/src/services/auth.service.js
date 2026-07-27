import bcrypt from "bcryptjs";
import { Op, UniqueConstraintError } from "sequelize";
import { RefreshSession, User } from "../models/index.js";
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

export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({
    where: { email: { [Op.iLike]: email } },
  });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw invalidCredentials();
  }

  await RefreshSession.destroy({
    where: {
      userId: user.id,
      expiresAt: { [Op.lt]: new Date() },
    },
  });

  const tokens = createAuthTokens(user);
  await RefreshSession.create({
    id: tokens.refreshId,
    userId: user.id,
    tokenHash: hashRefreshToken(tokens.refreshToken),
    expiresAt: tokens.refreshExpiresAt,
  });

  return {
    user: publicUser(user),
    accessToken: tokens.accessToken,
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
    refreshToken: tokens.refreshToken,
  };
};

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

  if (!session?.user) throw invalidRefreshToken();

  return {
    user: publicUser(session.user),
    accessToken: createAccessToken(session.user),
    accessTokenExpiresIn: ACCESS_TOKEN_TTL_SECONDS,
  };
};

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
