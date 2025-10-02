import { FastifyRequest, FastifyReply } from "fastify";
import { handleError } from "../error-handler";
import { ErrorFactory } from "../error-handler";

export interface RouteConfig<TBody = any, TParams = any, TQuery = any> {
  preHandler?: any[];
  schema?: {
    body?: any;
    params?: any;
    query?: any;
  };
  requireAuth?: boolean;
}

export abstract class BaseRoute<TBody = any, TParams = any, TQuery = any> {
  protected request: FastifyRequest;
  protected reply: FastifyReply;

  constructor(request: FastifyRequest, reply: FastifyReply) {
    this.request = request;
    this.reply = reply;
  }

  // Template method - klasa bazowa wywołuje execute, która jest implementowana w klasach potomnych
  async handle(): Promise<FastifyReply> {
    try {
      return await this.execute();
    } catch (error) {
      return handleError(error, this.reply);
    }
  }

  // Must be implemented by child classes
  protected abstract execute(): Promise<FastifyReply>;

  // Helper methods dostępne dla wszystkich klas potomnych
  protected getUserId(): string {
    if (!this.request.user?.id) {
      throw ErrorFactory.unauthorized("Wymagane zalogowanie");
    }
    return this.request.user.id;
  }

  protected parseBody<T = TBody>(): T {
    return this.request.body as T;
  }

  protected parseParams<T = TParams>(): T {
    return this.request.params as T;
  }

  protected parseQuery<T = TQuery>(): T {
    return this.request.query as T;
  }

  protected getReqHeader(name: string): string | undefined {
    return this.request.headers[name] as string | undefined;
  }

  // Create standardized responses
  protected success(data: any, message?: string, statusCode: number = 200): FastifyReply {
    const response: any = { data };
    if (message) response.message = message;
    return this.reply.status(statusCode).send(response);
  }

  protected created(data: any, message?: string): FastifyReply {
    return this.success(data, message, 201);
  }

  protected notFound(message?: string): FastifyReply {
    throw ErrorFactory.notFound(message || "Zasób nie został znaleziony");
  }

  protected badRequest(message: string): FastifyReply {
    throw ErrorFactory.badRequest(message);
  }

  protected unauthorized(message?: string): FastifyReply {
    throw ErrorFactory.unauthorized(message || "Wymagane zalogowanie");
  }
}

// Factory function dla tworzenia handler functions
export function createRouteHandler<TBody = any, TParams = any, TQuery = any>(
  RouteClass: new (request: FastifyRequest, reply: FastifyReply) => BaseRoute<TBody, TParams, TQuery>
): (request: FastifyRequest, reply: FastifyReply) => Promise<FastifyReply> {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const route = new RouteClass(request, reply);
    return route.handle();
  };
}
