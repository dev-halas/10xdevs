import { FastifyInstance } from "fastify";
import { requireAuth } from "../middlewares/auth";
import { CompaniesController } from "../controllers/companies.controller";

export async function registerCompanyRoutes(app: FastifyInstance): Promise<void> {
  app.post("/api/companies/add", { preHandler: requireAuth }, CompaniesController.create);
  app.get("/api/companies", { preHandler: requireAuth }, CompaniesController.list);
  app.get("/api/companies/:id", { preHandler: requireAuth }, CompaniesController.getById);
}
