import { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import cookie from "@fastify/cookie";

export function registerPlugins(app: FastifyInstance): void {
  app.register(helmet, { global: true });
  app.register(cors, { origin: true, credentials: true });
  app.register(cookie);
}


