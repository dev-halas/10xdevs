import { FastifyReply } from "fastify";

// Standard response interfaces
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  message?: string | undefined;
  meta?: {
    timestamp: string;
    requestId?: string | undefined;
    pagination?: any;
  };
}

export interface ApiPaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Response builder klasa
export class ResponseBuilder<T = any> {
  constructor(
    private reply: FastifyReply,
    private requestId?: string
  ) {}

  private buildBaseResponse(): Partial<ApiResponse<T>> {
    return {
      success: true,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.requestId,
      },
    };
  }

  // Success responses
  ok(data?: T, message?: string): FastifyReply {
    const response: ApiResponse<T> = {
      ...this.buildBaseResponse(),
      data,
      message,
    } as ApiResponse<T>;

    return this.reply.status(200).send(response);
  }

  created(data: T, message?: string): FastifyReply {
    return this.reply.status(201).send({
      success: true,
      data,
      message: message || "Zasób został utworzony",
      meta: this.buildBaseResponse().meta,
    });
  }

  accepted(message?: string): FastifyReply {
    return this.reply.status(202).send({
      success: true,
      message: message || "Żądanie zostało przyjęte",
      meta: this.buildBaseResponse().meta,
    });
  }

  noContent(): FastifyReply {
    return this.reply.status(204).send();
  }

  // Paginated response
  paginated<T>(
    data: T[],
    pagination: ApiPaginationMeta,
    message?: string
  ): FastifyReply {
    const response: ApiResponse<T[]> = {
      success: true,
      data,
      message,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: this.requestId,
        pagination,
      },
    };

    return this.reply.status(200).send(response);
  }

  // Error responses (delegated to error handler)
  badRequest(message: string, details?: any): FastifyReply {
    return this.reply.status(400).send({
      success: false,
      error: {
        code: "BAD_REQUEST",
        message,
        details,
      },
      meta: this.buildBaseResponse().meta,
    });
  }

  notFound(message: string = "Zasób nie został znaleziony"): FastifyReply {
    return this.reply.status(404).send({
      success: false,
      error: {
        code: "NOT_FOUND",
        message,
      },
      meta: this.buildBaseResponse().meta,
    });
  }

  unauthorized(message: string = "Wymagane zalogowanie"): FastifyReply {
    return this.reply.status(401).send({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message,
      },
      meta: this.buildBaseResponse().meta,
    });
  }
}

// Helper function do tworzenia ResponseBuilder
export function createResponseBuilder(reply: FastifyReply, requestId?: string): ResponseBuilder {
  return new ResponseBuilder(reply, requestId || reply.request.headers["x-request-id"] as string);
}

// Standard schematy odpowiedzi (dla dokumentacji API)
export const ApiResponseSchemas = {
  UserResponse: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      data: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          phone: { type: "string" },
          createdAt: { type: "string" },
        },
      },
      message: { type: "string" },
      meta: {
        type: "object",
        properties: {
          timestamp: { type: "string" },
          requestId: { type: "string" },
        },
      },
    },
  },

  PaginatedResponse: {
    type: "object",
    properties: {
      success: { type: "boolean" },
      data: {
        type: "array",
        items: { type: "object" },
      },
      pagination: {
        type: "object",
        properties: {
          currentPage: { type: "number" },
          totalPages: { type: "number" },
          totalItems: { type: "number" },
          itemsPerPage: { type: "number" },
          hasNextPage: { type: "boolean" },
          hasPreviousPage: { type: "boolean" },
        },
      },
      meta: {
        type: "object",
        properties: {
          timestamp: { type: "string" },
          requestId: { type: "string" },
        },
      },
    },
  },
};
