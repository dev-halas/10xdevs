import { FastifyInstance, FastifyRequest } from "fastify";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../utils/config";
import { isBlacklisted } from "../utils/redis";

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



