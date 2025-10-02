import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../utils/db";
import { requireAuth } from "../plugins/auth";
import { handleError } from "../utils/error-handler";
import { createResponseBuilder } from "../utils/core/api-standards";
import { z } from "zod";
import { PaginationHelpers } from "../utils/core/pagination";

// Validation schema
const UsersQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(50, Math.max(1, parseInt(val, 10))) : 10),
  search: z.string().optional(),
});

export async function registerUserRoutes(app: FastifyInstance): Promise<void> {
  // Protected route - only for authenticated users
  app.get("/api/users", { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = createResponseBuilder(reply);

      // Parse query parameters
      const query = UsersQuerySchema.parse(request.query || {});
      const { page, limit, search } = query;

      const searchParam = search || undefined;
      
      // Get users with pagination and search
      const [users, totalCount] = await Promise.all([
        prisma.user.findMany({
          where: searchParam ? {
            OR: [
              { email: { contains: searchParam, mode: 'insensitive' } },
              { phone: { contains: searchParam } },
            ]
          } : {},
          select: {
            id: true,
            email: true,
            phone: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: { companies: true }
            }
          },
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.user.count({ 
          where: searchParam ? {
            OR: [
              { email: { contains: searchParam, mode: 'insensitive' } },
              { phone: { contains: searchParam } },
            ]
          } : {}
        })
      ]);

      const paginationInfo = { 
        page, 
        limit, 
        skip: PaginationHelpers.calculateSkip(page, limit), 
        sortBy: 'createdAt' as const, 
        sortOrder: 'desc' as const 
      };
      const pagination = PaginationHelpers.buildPaginationResponse(
        users,
        totalCount,
        paginationInfo
      );

      return response.paginated(
        pagination.data,
        pagination.pagination,
        "Users list successfully fetched"
      );
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Public route for system availability (without sensitive data)
  app.get("/api/users/public", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = createResponseBuilder(reply);
      
      const publicStats = await prisma.user.aggregate({
        _count: { id: true },
        _min: { createdAt: true },
        _max: { createdAt: true }
      });

      return response.ok({
        totalUsers: publicStats._count.id,
        firstRegistration: publicStats._min.createdAt,
        latestRegistration: publicStats._max.createdAt,
      }, "Public users stats");
    } catch (error) {
      return handleError(error, reply);
    }
  });
}


