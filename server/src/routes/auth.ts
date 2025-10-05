import { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller";

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  // Register new user
  app.post("/api/auth/register", AuthController.register);

  // User login
  app.post("/api/auth/login", AuthController.login);

  // User logout
  app.post("/api/auth/logout", AuthController.logout);

  // Refresh access token
  app.post("/api/auth/refresh", AuthController.refresh);
}


