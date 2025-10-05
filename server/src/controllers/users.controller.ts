import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../utils/db";
import { createResponseBuilder } from "../utils/core/api-standards";
import { handleError } from "../utils/error-handler";
import { z } from "zod";

const UsersQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.min(50, Math.max(1, parseInt(val, 10))) : 10),
  search: z.string().optional(),
});

export const UsersController = {
  list: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = createResponseBuilder(reply);

      const query = UsersQuerySchema.parse(request.query || {});
      const { page, limit, search } = query;
      const searchParam = search || undefined;

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

      const totalPages = Math.ceil(totalCount / limit);
      const pagination = {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };

      return response.paginated(
        users,
        pagination,
        "Users list successfully fetched"
      );
    } catch (error) {
      return handleError(error, reply);
    }
  },

  publicStats: async (request: FastifyRequest, reply: FastifyReply) => {
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
  },
};


