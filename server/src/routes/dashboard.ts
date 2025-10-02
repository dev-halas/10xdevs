import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../utils/db";
import { requireAuth } from "../plugins/auth";
import { handleError } from "../utils/error-handler";
import { createResponseBuilder } from "../utils/core/api-standards";

export async function registerDashboardRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/dashboard", { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;
      const response = createResponseBuilder(reply);

      const userData = await prisma.user.findUnique({
        where: { id: userId },
        select: { 
          id: true, 
          email: true, 
          phone: true, 
          createdAt: true,
          updatedAt: true,
          companies: {
            select: {
              id: true,
              name: true,
              nip: true,
              regon: true,
              createdAt: true,
              updatedAt: true,
            },
            orderBy: {
              createdAt: 'desc'
            }
          }
        },
      });

      if (!userData) {
        return response.notFound('Użytkownik nie znaleziony');
      }

      const dashboardData = {
        user: {
          id: userData.id,
          email: userData.email,
          phone: userData.phone,
        },
        companies: userData.companies,
        stats: {
          registeredAt: userData.createdAt,
          lastUpdate: userData.updatedAt,
          companiesCount: userData.companies.length,
        },
      };

      return response.ok(dashboardData, "Witaj w dashboard!");
    } catch (error) {
      return handleError(error, reply);
    }
  });
}
