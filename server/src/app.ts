import Fastify, { FastifyInstance } from "fastify";
import { registerPlugins } from "./plugins";
import { registerAuthPlugin } from "./plugins/auth";
import { registerHealthRoutes } from "./routes/health";
import { registerAuthRoutes } from "./routes/auth";
import { registerUserRoutes } from "./routes/users";
import { registerDashboardRoutes } from "./routes/dashboard";
import { registerCompanyRoutes } from "./routes/companies";

export function buildServer(): FastifyInstance {
  const app = Fastify({ logger: true });
  registerPlugins(app);
  registerAuthPlugin(app);
  registerHealthRoutes(app);
  registerAuthRoutes(app);
  registerUserRoutes(app);
  registerDashboardRoutes(app);
  registerCompanyRoutes(app);
  return app;
}


