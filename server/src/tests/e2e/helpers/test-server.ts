import { FastifyInstance } from "fastify";
import { buildServer } from "../../../app";

/**
 * Tworzy instancję testowego serwera
 */
export async function createTestServer(): Promise<FastifyInstance> {
  const app = buildServer();
  await app.ready();
  return app;
}

/**
 * Teardown po testach - zamyka serwer
 */
export async function teardownTests(app?: FastifyInstance): Promise<void> {
  if (app) {
    await app.close();
  }
}
