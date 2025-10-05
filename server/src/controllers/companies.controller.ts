import { FastifyReply, FastifyRequest } from "fastify";
import { prisma } from "../utils/db";
import { createResponseBuilder } from "../utils/core/api-standards";
import { handleError } from "../utils/error-handler";
import { CompanyValidationSchemas, CompanyDataNormalizers, CompanyValidators } from "../utils/helpers/company-helpers";
import { PaginationHelpers } from "../utils/core/pagination";

export const CompaniesController = {
  create: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;
      const response = createResponseBuilder(reply);
      const parsed = CompanyValidationSchemas.create.parse(request.body);
      const normalizedData = {
        name: CompanyDataNormalizers.name(parsed.name),
        nip: CompanyDataNormalizers.nip(parsed.nip),
        regon: CompanyDataNormalizers.regon(parsed.regon),
      };
      CompanyValidators.validateCompanyData(normalizedData);
      const company = await prisma.company.create({
        data: { ...normalizedData, userId },
        select: { id: true, name: true, nip: true, regon: true, createdAt: true, updatedAt: true }
      });
      return response.created(company, "Company successfully created");
    } catch (error) {
      return handleError(error, reply);
    }
  },

  list: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;
      const response = createResponseBuilder(reply);
      const queryParams = PaginationHelpers.parseParams(request.query || {});
      const paginationInfo = {
        ...queryParams,
        skip: PaginationHelpers.calculateSkip(queryParams.page, queryParams.limit),
      };
      const [companies, totalCount] = await Promise.all([
        prisma.company.findMany({
          where: { userId },
          skip: paginationInfo.skip,
          take: paginationInfo.limit,
          select: { id: true, name: true, nip: true, regon: true, createdAt: true, updatedAt: true },
          orderBy: PaginationHelpers.createOrderBy(paginationInfo.sortBy, paginationInfo.sortOrder),
        }),
        prisma.company.count({ where: { userId } })
      ]);
      const pagination = PaginationHelpers.buildPaginationResponse(companies, totalCount, paginationInfo);
      return response.paginated(pagination.data, pagination.pagination, "User companies successfully fetched");
    } catch (error) {
      return handleError(error, reply);
    }
  },

  getById: async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const userId = request.user!.id;
      const response = createResponseBuilder(reply);
      const { id } = CompanyValidationSchemas.params.parse(request.params);
      const company = await prisma.company.findFirst({
        where: { id, userId },
        select: { id: true, name: true, nip: true, regon: true, createdAt: true, updatedAt: true }
      });
      if (!company) {
        return response.notFound("Company not found");
      }
      return response.ok(company, "Company successfully fetched");
    } catch (error) {
      return handleError(error, reply);
    }
  },
};


