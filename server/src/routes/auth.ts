import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../utils/db";
import { 
  ValidationSchemas, 
  DataNormalizers, 
  PasswordHelpers, 
  TokenHelpers, 
  UserHelpers, 
  ResponseValidators 
} from "../utils/helpers/auth-helpers";
import { handleError, ErrorFactory } from "../utils/error-handler";
import { createResponseBuilder } from "../utils/core/api-standards";
import { addToBlacklist } from "../utils/redis";
import { JWT_EXPIRES_IN_SECONDS } from "../utils/config";

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  // Register new user
  app.post("/api/auth/register", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = createResponseBuilder(reply);
      
      // Validate input data
      const parsed = ValidationSchemas.register.parse(request.body);
      
      // Normalize data
      const email = DataNormalizers.email(parsed.email);
      const phone = DataNormalizers.phone(parsed.phone);

      // Hash password
      const passwordHash = await PasswordHelpers.hash(parsed.password);

      // Create user - relies on unique indices (race-safe)
      const user = await prisma.user.create({
        data: { email, phone, passwordHash },
        select: { id: true, email: true, phone: true, createdAt: true },
      });

      // Validate response (only in dev)
      ResponseValidators.validateResponse(ResponseValidators.registerResponse, { user });

      return response.created(user, "User successfully registered");
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // User login
  app.post("/api/auth/login", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = createResponseBuilder(reply);
      
      // Validate input data
      const parsed = ValidationSchemas.login.parse(request.body);
      
      // Normalize identifier
      const { isEmail, normalized } = DataNormalizers.identifier(parsed.identifier);
      const where = isEmail 
        ? { email: normalized } 
        : { phone: normalized };

      // Find user
      const user = await prisma.user.findUnique({
        where,
        select: { id: true, email: true, phone: true, passwordHash: true },
      });

      if (!user) {
        throw ErrorFactory.unauthorized("Invalid login data");
      }

      // Verify password
      const isPasswordValid = await PasswordHelpers.verify(parsed.password, user.passwordHash);
      if (!isPasswordValid) {
        throw ErrorFactory.unauthorized("Invalid login data");
      }

      // Generate tokens
      const token = TokenHelpers.generateAccessToken(user.id);
      const { id: refreshTokenId, token: refreshToken } = await TokenHelpers.generateRefreshToken(user.id);

      const publicUser = UserHelpers.createPublicUser(user);
      
      // Validate response (only in dev)
      ResponseValidators.validateResponse(ResponseValidators.loginResponse, { 
        user: publicUser, 
        token, 
        refreshToken 
      });

      const loginData = { 
        user: publicUser, 
        token, 
        refreshToken, 
        refreshTokenId 
      };

      return response.ok(loginData, "Login successful");
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // User logout
  app.post("/api/auth/logout", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = createResponseBuilder(reply);
      
      const body = ValidationSchemas.logout.refine(
        (data) => !data.refreshTokenId || data.refreshTokenId.trim().length > 0
      ).parse(request.body);

      // If user is logged in and provided refreshTokenId, delete it
      if (request.user?.id && body.refreshTokenId) {
        await TokenHelpers.revokeRefreshToken(request.user.id, body.refreshTokenId);
      }

      return response.ok(null, "Logged out");
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Refresh access token
  app.post("/api/auth/refresh", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = createResponseBuilder(reply);
      
      const body = ValidationSchemas.refresh.parse(request.body);
      
      if (!request.user?.id) {
        throw ErrorFactory.unauthorized("User context not found");
      }

      // Verify if refresh token is valid
      const isValidRefreshToken = await TokenHelpers.verifyRefreshToken(
        request.user.id,
        body.refreshTokenId,
        body.refreshToken
      );

      if (!isValidRefreshToken) {
        throw ErrorFactory.unauthorized("Invalid refresh token");
      }

      // Get old access token from header for blacklisting
      const auth = request.headers["authorization"];
      const oldToken = typeof auth === "string" ? auth.split(" ")[1] : null;

      // Delete old refresh token
      await TokenHelpers.revokeRefreshToken(request.user.id, body.refreshTokenId);

      // Generate new tokens
      const newAccessToken = TokenHelpers.generateAccessToken(request.user.id);
      const { id: newRefreshTokenId, token: newRefreshToken } = await TokenHelpers.generateRefreshToken(request.user.id);

      // Add old access token to blacklist
      if (oldToken) {
        await addToBlacklist(oldToken, JWT_EXPIRES_IN_SECONDS);
      }

      const refreshData = { 
        token: newAccessToken, 
        refreshTokenId: newRefreshTokenId, 
        refreshToken: newRefreshToken 
      };

      return response.ok(refreshData, "Token refreshed");
    } catch (error) {
      return handleError(error, reply);
    }
  });
}


