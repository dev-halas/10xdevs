import { FastifyInstance } from "fastify";
import { requireAuth } from "../middlewares/auth";
import { UsersController } from "../controllers/users.controller";

export async function registerUserRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/users", { preHandler: requireAuth }, UsersController.list);
  app.get("/api/users/public", UsersController.publicStats);
}


