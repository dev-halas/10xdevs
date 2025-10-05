import { prisma } from "../utils/db";
import { 
  ValidationSchemas,
  DataNormalizers,
  PasswordHelpers,
  TokenHelpers,
  UserHelpers,
} from "../utils/helpers/auth-helpers";
import { addToBlacklist } from "../utils/redis";
import { JWT_EXPIRES_IN_SECONDS } from "../utils/config";
import { ErrorFactory } from "../utils/error-handler";

export type RegisterInput = {
  email: string;
  phone: string;
  password: string;
};

export type LoginInput = {
  identifier: string;
  password: string;
};

export type LogoutInput = {
  refreshTokenId?: string;
};

export type RefreshInput = {
  userId: string;
  refreshTokenId: string;
  refreshToken: string;
  oldAccessToken?: string | null;
};

export const AuthService = {
  async register(input: RegisterInput) {
    const parsed = ValidationSchemas.register.parse(input);
    const email = DataNormalizers.email(parsed.email);
    const phone = DataNormalizers.phone(parsed.phone);
    const passwordHash = await PasswordHelpers.hash(parsed.password);

    const user = await prisma.user.create({
      data: { email, phone, passwordHash },
      select: { id: true, email: true, phone: true, createdAt: true },
    });

    return { user };
  },

  async login(input: LoginInput) {
    const parsed = ValidationSchemas.login.parse(input);
    const { isEmail, normalized } = DataNormalizers.identifier(parsed.identifier);
    const where = isEmail ? { email: normalized } : { phone: normalized };

    const user = await prisma.user.findUnique({
      where,
      select: { id: true, email: true, phone: true, passwordHash: true },
    });

    if (!user) {
      throw ErrorFactory.unauthorized("Invalid login data");
    }

    const isPasswordValid = await PasswordHelpers.verify(parsed.password, user.passwordHash);
    if (!isPasswordValid) {
      throw ErrorFactory.unauthorized("Invalid login data");
    }

    const token = TokenHelpers.generateAccessToken(user.id);
    const { id: refreshTokenId, token: refreshToken } = await TokenHelpers.generateRefreshToken(user.id);

    const publicUser = UserHelpers.createPublicUser(user);

    return { user: publicUser, token, refreshToken, refreshTokenId };
  },

  async logout(userId: string | undefined, input: LogoutInput) {
    const body = ValidationSchemas.logout
      .refine((data) => !data.refreshTokenId || data.refreshTokenId.trim().length > 0)
      .parse(input);

    if (userId && body.refreshTokenId) {
      await TokenHelpers.revokeRefreshToken(userId, body.refreshTokenId);
    }

    return { ok: true };
  },

  async refresh(input: RefreshInput) {
    const body = ValidationSchemas.refresh.parse({
      refreshTokenId: input.refreshTokenId,
      refreshToken: input.refreshToken,
    });

    if (!input.userId) {
      throw ErrorFactory.unauthorized("User context not found");
    }

    const isValidRefreshToken = await TokenHelpers.verifyRefreshToken(
      input.userId,
      body.refreshTokenId,
      body.refreshToken
    );

    if (!isValidRefreshToken) {
      throw ErrorFactory.unauthorized("Invalid refresh token");
    }

    if (input.oldAccessToken) {
      await addToBlacklist(input.oldAccessToken, JWT_EXPIRES_IN_SECONDS);
    }

    await TokenHelpers.revokeRefreshToken(input.userId, body.refreshTokenId);

    const newAccessToken = TokenHelpers.generateAccessToken(input.userId);
    const { id: newRefreshTokenId, token: newRefreshToken } = await TokenHelpers.generateRefreshToken(input.userId);

    return {
      token: newAccessToken,
      refreshTokenId: newRefreshTokenId,
      refreshToken: newRefreshToken,
    };
  },
};


