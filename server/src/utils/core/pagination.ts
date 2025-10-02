import { z } from "zod";
import { ErrorFactory } from "../error-handler";

// Standard pagination query schema
export const PaginationSchema = z.object({
  page: z.string().optional()
    .transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional()
    .transform(val => val ? Math.min(100, Math.max(1, parseInt(val, 10))) : 10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type PaginationQuery = z.infer<typeof PaginationSchema>;

export interface PaginationInfo {
  page: number;
  limit: number;
  skip: number;
  sortBy?: string | undefined;
  sortOrder: "asc" | "desc";
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

// Helper functions dla paginacji
export const PaginationHelpers = {
  parseParams: (query: any): PaginationQuery => {
    return PaginationSchema.parse(query);
  },

  calculateSkip: (page: number, limit: number): number => {
    return (page - 1) * limit;
  },

  getTotalPages: (totalItems: number, itemsPerPage: number): number => {
    return Math.ceil(totalItems / itemsPerPage);
  },

  createOrderBy: (sortBy?: string, sortOrder: "asc" | "desc" = "desc") => {
    if (!sortBy) return { createdAt: "desc" as const };
    return { [sortBy]: sortOrder } as any;
  },

  buildPaginationResponse: <T>(
    data: T[],
    totalItems: number,
    paginationInfo: PaginationInfo
  ): PaginationResult<T> => {
    const totalPages = PaginationHelpers.getTotalPages(totalItems, paginationInfo.limit);
    
    return {
      data,
      pagination: {
        currentPage: paginationInfo.page,
        totalPages,
        totalItems,
        itemsPerPage: paginationInfo.limit,
        hasNextPage: paginationInfo.page < totalPages,
        hasPreviousPage: paginationInfo.page > 1,
      },
    };
  },

  validateSortableFields: (sortBy: string | undefined, allowedFields: string[]): void => {
    if (sortBy && !allowedFields.includes(sortBy)) {
      throw ErrorFactory.badRequest(
        `Nieprawidłowe pole sortowania. Dozwolone pola: ${allowedFields.join(", ")}`
      );
    }
  },
};

// Database helper dla łatwej paginacji z Prisma
export const DatabasePagination = {
  async paginate<T>(
    prismaQuery: any,
    paginationInfo: PaginationInfo,
    countQuery?: any
  ): Promise<PaginationResult<T>> {
    const { page, limit, skip, sortBy, sortOrder } = paginationInfo;
    
    // Execute both queries in parallel
    const [data, totalItems] = await Promise.all([
      prismaQuery.skip(skip).take(limit),
      countQuery || prismaQuery.count()
    ]);

    return PaginationHelpers.buildPaginationResponse(
      data,
      typeof totalItems === "number" ? totalItems : totalItems.length,
      paginationInfo
    );
  },
};
