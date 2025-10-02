import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../utils/config";
import { isBlacklisted } from "../utils/redis";
import { createResponseBuilder } from "../utils/core/api-standards";

// Fastify augmentation dla obsługi user context
declare module "fastify" {
  interface FastifyRequest {
    user?: { 
      id: string; 
      email?: string; 
      phone?: string; 
      createdAt?: Date 
    };
  }
}

// Authorization helpers
export const AuthHelpers = {
  extractBearerToken: (authHeader?: string): string | null => {
    if (typeof authHeader !== "string") {
      return null;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2) {
      return null;
    }

    const scheme = parts[0]?.toLowerCase();
    const token = parts[1];
    
    return scheme === "bearer" && token ? token : null;
  },

  verifyToken: async (token: string): Promise<string | null> => {
    try {
      // Sprawdź czy token jest na blackliście
      if (await isBlacklisted(token)) {
        return null;
      }
      
      const payload = jwt.verify(token, JWT_SECRET) as { sub?: string };
      return payload?.sub || null;
    } catch {
      // Niepoprawne/wygaśnięte tokeny
      return null;
    }
  },

  setUserContext: async (request: FastifyRequest, userId: string): Promise<void> => {
    // Opcjonalnie można tutaj dodać ładowanie dodatkowych danych użytkownika z DB
    // request.user = { id: userId, email, phone, createdAt };
    request.user = { id: userId };
  },
};

// Main auth plugin registration
export function registerAuthPlugin(app: FastifyInstance): void {
  app.addHook("preHandler", async (request) => {
    const token = AuthHelpers.extractBearerToken(request.headers["authorization"]);
    
    if (!token) {
      return; // Brak tokenu - route może być publiczna
    }

    const userId = await AuthHelpers.verifyToken(token);
    
    if (userId) {
      await AuthHelpers.setUserContext(request, userId);
    }
  });
}

// Auth middleware functions
export const AuthMiddleware = {
  requireAuth: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    if (!request.user?.id) {
      const response = createResponseBuilder(reply);
      throw response.unauthorized("Wymagane zalogowanie");
    }
  },

  requireAdmin: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Placeholder dla przyszłej rolowej autoryzacji
    await AuthMiddleware.requireAuth(request, reply);
    
    // Przykład dla przyszłej implementacji:
    // if (!request.user?.isAdmin) {
    //   const response = createResponseBuilder(reply);
    //   throw response.forbidden("Wymagane uprawnienia administratora");
    // }
  },

  optionalAuth: async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    // Dla endpoint-ów które działają zarówno z auth jak i bez
    // Authentication is optional - jeśli token istnieje i jest prawidłowy, setuj request.user
    // jeśli nie - po prostu kontynuuj bez request.user
    return; // Implementacja już jest w preHandler
  },
};

// Utility functions for auth
export const AuthUtils = {
  isAuthenticated: (request: FastifyRequest): boolean => {
    return Boolean(request.user?.id);
  },

  getUserId: (request: FastifyRequest): string | null => {
    return request.user?.id || null;
  },

  requireUserId: (request: FastifyRequest): string => {
    if (!request.user?.id) {
      throw new Error("User ID required but not found in request context");
    }
    return request.user.id;
  },

  hasPermission: (request: FastifyRequest, permission: string): boolean => {
    // Placeholder dla przyszłego systemu uprawnień
    return AuthUtils.isAuthenticated(request);
  },
};

// Legacy compatibility function
export async function requireAuth(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  return AuthMiddleware.requireAuth(request, reply);
}


