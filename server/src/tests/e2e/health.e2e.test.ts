import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { FastifyInstance } from "fastify";
import { createTestServer, teardownTests } from "./helpers/test-server";

describe("E2E: Podstawowe testy", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createTestServer();
  });

  afterAll(async () => {
    await teardownTests(app);
  });

  describe("Health Check", () => {
    it("GET /api/healthcheck - powinien zwrócić status OK", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/healthcheck",
      });

      expect(response.statusCode).toBe(200);
      const data = JSON.parse(response.body);
      expect(data).toHaveProperty("status");
      expect(data.status).toBe("ok");
    });
  });
});
