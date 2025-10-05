import { FastifyInstance } from "fastify";
import { requireAuth } from "../middlewares/auth";
import { DashboardController } from "../controllers/dashboard.controller";

export async function registerDashboardRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/dashboard", { preHandler: requireAuth }, DashboardController.getDashboard);
}
