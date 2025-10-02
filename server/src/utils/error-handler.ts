import { FastifyReply } from "fastify";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export enum ErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  DUPLICATE_ENTRY = "DUPLICATE_ENTRY", 
  NOT_FOUND = "NOT_FOUND",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
  BAD_REQUEST = "BAD_REQUEST",
}

export interface ErrorResponse {
  code: ErrorCode;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export class AppError extends Error {
  public code: ErrorCode;
  public statusCode: number;
  public details?: any;

  constructor(
    message: string, 
    code: ErrorCode, 
    statusCode: number = 500, 
    details?: any
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    // Maintains proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

// Factory functions dla często używanych błędów
export const ErrorFactory = {
  validation: (details: ZodError["issues"]) => 
    new AppError("Błędne dane wejściowe", ErrorCode.VALIDATION_ERROR, 400, details),
  
  duplicate: (field: string) => 
    new AppError(`Wartość ${field} już istnieje`, ErrorCode.DUPLICATE_ENTRY, 409),
  
  notFound: (resource: string) => 
    new AppError(`${resource} nie został znaleziony`, ErrorCode.NOT_FOUND, 404),
  
  unauthorized: (message: string = "Nieautoryzowany dostęp") => 
    new AppError(message, ErrorCode.UNAUTHORIZED, 401),
  
  forbidden: (message: string = "Brak uprawnień") => 
    new AppError(message, ErrorCode.FORBIDDEN, 403),
  
  internal: (message: string = "Wewnętrzny błąd serwera") => 
    new AppError(message, ErrorCode.INTERNAL_SERVER_ERROR, 500),
  
  badRequest: (message: string) => 
    new AppError(message, ErrorCode.BAD_REQUEST, 400),
};

// Główna funkcja error handlera
export function handleError(error: unknown, reply: FastifyReply): FastifyReply {
  const timestamp = new Date().toISOString();
  const requestId = reply.request.headers["x-request-id"] as string;

  // AppError - nasze własne błędy
  if (error instanceof AppError) {
    return reply.status(error.statusCode).send({
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp,
      requestId,
    });
  }

  // ZodError - błędy walidacji
  if (error instanceof ZodError) {
    return reply.status(400).send({
      code: ErrorCode.VALIDATION_ERROR,
      message: "Błędne dane",
      details: error.flatten(),
      timestamp,
      requestId,
    });
  }

  // Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002":
        return reply.status(409).send({
          code: ErrorCode.DUPLICATE_ENTRY,
          message: "Dane już istnieją",
          details: { constraint: error.meta?.target },
          timestamp,
          requestId,
        });
      
      case "P2025":
        return reply.status(404).send({
          code: ErrorCode.NOT_FOUND,
          message: "Zasób nie został znaleziony",
          details: { model: error.meta?.model },
          timestamp,
          requestId,
        });
      
      default:
        return reply.status(500).send({
          code: ErrorCode.INTERNAL_SERVER_ERROR,
          message: "Błąd bazy danych",
          details: { prismaCode: error.code },
          timestamp,
          requestId,
        });
    }
  }


  // Generic Error lub unknown
  const message = error instanceof Error ? error.message : "Nieznany błąd";
  console.error("Unhandled error:", error);
  
  return reply.status(500).send({
    code: ErrorCode.INTERNAL_SERVER_ERROR,
    message: process.env.NODE_ENV === "production" ? "Wewnętrzny błąd serwera" : message,
    timestamp,
    requestId,
  });
}

// Async wrapper dla route handlers
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      const reply = args[1] as FastifyReply;
      throw error; // Let the main error handler catch it
    }
  };
}
