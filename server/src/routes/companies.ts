import { FastifyInstance } from "fastify";
import { requireAuth } from "../middlewares/auth";
import { CompaniesController } from "../controllers/companies.controller";

export async function registerCompanyRoutes(app: FastifyInstance): Promise<void> {
  // Add a new company
  app.post("/api/companies/add", { preHandler: requireAuth }, CompaniesController.create);

  // Get all companies
  app.get("/api/companies", { preHandler: requireAuth }, CompaniesController.list);

  // Get a company by id
  app.get("/api/companies/:id", { preHandler: requireAuth }, CompaniesController.getById);
}
