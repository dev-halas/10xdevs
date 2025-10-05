import { FastifyReply, FastifyRequest } from "fastify";
import { createResponseBuilder } from "../utils/core/api-standards";

export const AuthMiddleware = {
  requireAuth: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user?.id) {
      const response = createResponseBuilder(reply);
      throw response.unauthorized("Wymagane zalogowanie");
    }
  },

  requireAdmin: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    await AuthMiddleware.requireAuth(request, reply);
    // Przyszła weryfikacja ról/uprawnień
  },
};

export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  return AuthMiddleware.requireAuth(request, reply);
}

export const AuthUtils = {
  isAuthenticated: (request: FastifyRequest): boolean => Boolean(request.user?.id),
  getUserId: (request: FastifyRequest): string | null => request.user?.id || null,
  requireUserId: (request: FastifyRequest): string => {
    if (!request.user?.id) {
      throw new Error("User ID required but not found in request context");
    }
    return request.user.id;
  },
};


