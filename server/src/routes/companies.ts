import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../utils/db";
import { requireAuth } from "../plugins/auth";
import { handleError } from "../utils/error-handler";
import { createResponseBuilder } from "../utils/core/api-standards";
import { CompanyValidationSchemas, CompanyDataNormalizers, CompanyValidators } from "../utils/helpers/company-helpers";
import { PaginationHelpers } from "../utils/core/pagination";

export async function registerCompanyRoutes(app: FastifyInstance): Promise<void> {
  // Create company
  app.post("/api/companies", { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;
      const response = createResponseBuilder(reply);

      // Validate and normalize input data
      const parsed = CompanyValidationSchemas.create.parse(request.body);
      
      // Normalize data
      const normalizedData = {
        name: CompanyDataNormalizers.name(parsed.name),
        nip: CompanyDataNormalizers.nip(parsed.nip),
        regon: CompanyDataNormalizers.regon(parsed.regon),
      };

      // Business validation
      CompanyValidators.validateCompanyData(normalizedData);

      // Create company
      const company = await prisma.company.create({
        data: { ...normalizedData, userId },
        select: {
          id: true,
          name: true,
          nip: true,
          regon: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      return response.created(company, "Company successfully created");
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Get all user's companies with pagination and search
  app.get("/api/companies", { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;
      const response = createResponseBuilder(reply);

      // Parse pagination
      const queryParams = PaginationHelpers.parseParams(request.query || {});
      const paginationInfo = {
        ...queryParams,
        skip: PaginationHelpers.calculateSkip(queryParams.page, queryParams.limit),
      };

      // Get companies with pagination and search 
      const [companies, totalCount] = await Promise.all([
        prisma.company.findMany({
          where: { userId },
          skip: paginationInfo.skip,
          take: paginationInfo.limit,
          select: {
            id: true,
            name: true,
            nip: true,
            regon: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: PaginationHelpers.createOrderBy(paginationInfo.sortBy, paginationInfo.sortOrder),
        }),
        prisma.company.count({ where: { userId } })
      ]);

      const pagination = PaginationHelpers.buildPaginationResponse(
        companies,
        totalCount,
        paginationInfo
      );

      return response.paginated(pagination.data, pagination.pagination, "User companies successfully fetched");
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Get single company by ID
  app.get("/api/companies/:id", { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;
      const response = createResponseBuilder(reply);

      const { id } = CompanyValidationSchemas.params.parse(request.params);

      const company = await prisma.company.findFirst({
        where: { id, userId },
        select: {
          id: true,
          name: true,
          nip: true,
          regon: true,
          createdAt: true,
          updatedAt: true,
        }
      });

      if (!company) {
        return response.notFound("Company not found");
      }

      return response.ok(company, "Company successfully fetched");
    } catch (error) {
      return handleError(error, reply);
    }
  });
}
