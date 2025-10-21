import { z } from "zod";
import { ErrorFactory } from "../error-handler";

// Schemas for validating company data
export const CompanyValidationSchemas = {
  create: z.object({
    name: z.string()
      .min(1, "Nazwa firmy jest wymagana")
      .max(100, "Nazwa firmy może mieć max. 100 znaków")
      .transform(val => val.trim()),
    nip: z.string()
      .min(1, "NIP jest wymagany")
      .regex(/^[0-9\s\-]{10,13}$/, "Nieprawidłowy format NIP"),
    regon: z.string()
      .min(1, "REGON jest wymagany")
      .regex(/^[0-9\s\-]{9,17}$/, "Nieprawidłowy format REGON"),
  }),

  params: z.object({
    id: z.string().min(1, "ID firmy jest wymagane"),
  }),

  query: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
  }),
};

// Functions for normalizing company data
export const CompanyDataNormalizers = {
  nip: (nip: string): string => {
    const clean = nip.replace(/[\s\-]/g, "");
    return clean;
  },

  regon: (regon: string): string => {
    const clean = regon.replace(/[\s\-]/g, "");
    return clean;
  },

  name: (name: string): string => {
    return name.trim().replace(/\s+/g, " ");
  },
};

// Functions for business validation
export const CompanyValidators = {
  validateNip: (nip: string): void => {
    if (!/^\d{10}$/.test(nip)) {
      throw ErrorFactory.badRequest("NIP musi składać się z dokładnie 10 cyfr");
    }
  },

  validateRegon: (regon: string): void => {
    if (!/^\d{9}$|^\d{14}$/.test(regon)) {
      throw ErrorFactory.badRequest("REGON musi składać się z 9 lub 14 cyfr");
    }
  },

  validateCompanyData: (data: { name: string; nip: string; regon: string }): void => {
    const cleanNip = CompanyDataNormalizers.nip(data.nip);
    const cleanRegon = CompanyDataNormalizers.regon(data.regon);

    CompanyValidators.validateNip(cleanNip);
    CompanyValidators.validateRegon(cleanRegon);
  },
};

// Functions related to user and permissions
export const CompanyAccessControl = {
  ensureUserOwnsCompany: async (
    userId: string, 
    companyId: string,
    prisma: any // PrismaClient type
  ): Promise<any> => {
    const company = await prisma.company.findFirst({
      where: { id: companyId, userId },
    });

    if (!company) {
      throw ErrorFactory.notFound("Firma nie została znaleziona lub nie masz do niej dostępu");
    }

    return company;
  },

  getUserCompanies: async (
    userId: string,
    prisma: any,
    options?: { page?: number; limit?: number }
  ) => {
    const { page = 1, limit = 10 } = options || {};
    const skip = (page - 1) * limit;

    return prisma.company.findMany({
      where: { userId },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        nip: true,
        regon: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  },
};

// Response builders for companies
export const CompanyResponseBuilders = {
  createCompanyResponse: (company: any) => ({
    company: CompanyResponseBuilders.formatCompany(company),
    message: "Firma została pomyślnie dodana",
  }),

  formatCompany: (company: any) => ({
    id: company.id,
    name: company.name,
    nip: company.nip,
    regon: company.regon,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  }),

  companiesListResponse: (companies: any[], totalCount: number) => ({
    companies: companies.map(CompanyResponseBuilders.formatCompany),
    count: totalCount,
    message: "Firmy użytkownika pobrane pomyślnie",
  }),
};
