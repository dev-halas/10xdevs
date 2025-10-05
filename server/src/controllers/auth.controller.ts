import { FastifyReply, FastifyRequest } from "fastify";
import { createResponseBuilder } from "../utils/core/api-standards";
import { handleError } from "../utils/error-handler";
import { AuthService } from "../services/auth.service";

export const AuthController = {
  register: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = createResponseBuilder(reply);
      const { user } = await AuthService.register(request.body as any);
      return response.created(user, "User successfully registered");
    } catch (error) {
      return handleError(error, reply);
    }
  },

  login: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = createResponseBuilder(reply);
      const loginData = await AuthService.login(request.body as any);
      return response.ok(loginData, "Login successful");
    } catch (error) {
      return handleError(error, reply);
    }
  },

  logout: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = createResponseBuilder(reply);
      await AuthService.logout(request.user?.id, request.body as any);
      return response.ok(null, "Logged out");
    } catch (error) {
      return handleError(error, reply);
    }
  },

  refresh: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = createResponseBuilder(reply);
      const auth = request.headers["authorization"];
      const oldToken = typeof auth === "string" ? auth.split(" ")[1] : null;
      const refreshData = await AuthService.refresh({
        userId: request.user?.id as string,
        refreshTokenId: (request.body as any).refreshTokenId,
        refreshToken: (request.body as any).refreshToken,
        oldAccessToken: oldToken ?? null,
      });
      return response.ok(refreshData, "Token refreshed");
    } catch (error) {
      return handleError(error, reply);
    }
  },
};


