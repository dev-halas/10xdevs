import { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import { ErrorFactory } from "../error-handler";

export interface EntityRepository<T, CreateInput, UpdateInput, WhereInput> {
  findById(id: string): Promise<T | null>;
  findMany(where?: WhereInput, options?: QueryOptions): Promise<T[]>;
  findFirst(where: WhereInput): Promise<T | null>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<void>;
  count(where?: WhereInput): Promise<number>;
  exists(where: WhereInput): Promise<boolean>;
}

export interface QueryOptions {
  skip?: number;
  take?: number;
  orderBy?: any;
  select?: any;
}

// Base repository class
export abstract class BaseRepository<T, CreateInput, UpdateInput, WhereInput>
  implements EntityRepository<T, CreateInput, UpdateInput, WhereInput>
{
  constructor(protected prisma: PrismaClient, protected model: string) {}

  async findById(id: string): Promise<T | null> {
    return (this.prisma as any)[this.model].findUnique({ where: { id } });
  }

  async findMany(where?: WhereInput, options?: QueryOptions): Promise<T[]> {
    const query: any = { where };
    if (options) {
      Object.assign(query, options);
    }
    return (this.prisma as any)[this.model].findMany(query);
  }

  async findFirst(where: WhereInput): Promise<T | null> {
    return (this.prisma as any)[this.model].findFirst({ where });
  }

  async create(data: CreateInput): Promise<T> {
    try {
      return (this.prisma as any)[this.model].create({ data });
    } catch (error) {
      this.handleError(error);
    }
  }

  async update(id: string, data: UpdateInput): Promise<T> {
    try {
      return (this.prisma as any)[this.model].update({
        where: { id },
        data,
      });
    } catch (error) {
      this.handleError(error);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await (this.prisma as any)[this.model].delete({ where: { id } });
    } catch (error) {
      this.handleError(error);
    }
  }

  async count(where?: WhereInput): Promise<number> {
    return (this.prisma as any)[this.model].count({ where });
  }

  async exists(where: WhereInput): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  // Hook for custom error handling - override in child classes
  protected handleError(error: any): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          throw ErrorFactory.duplicate("Duplikacja danych");
        case "P2025":
          throw ErrorFactory.notFound("Zasób nie został znaleziony");
        default:
          throw ErrorFactory.internal(`Błąd bazy danych: ${error.code}`);
      }
    }
    throw error;
  }
}

// User Repository
export class UserRepository extends BaseRepository<any, any, any, any> {
  constructor(prisma: PrismaClient) {
    super(prisma, "user");
  }

  async findByEmail(email: string): Promise<any> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByPhone(phone: string): Promise<any> {
    return this.prisma.user.findUnique({ where: { phone } });
  }

  async findByEmailOrPhone(identifier: string): Promise<any> {
    const isEmail = identifier.includes("@");
    const where = isEmail ? { email: identifier } : { phone: identifier };
    return this.prisma.user.findUnique({ where });
  }
}

// Company Repository
export class CompanyRepository extends BaseRepository<any, any, any, any> {
  constructor(prisma: PrismaClient) {
    super(prisma, "company");
  }

  async findByUserId(userId: string): Promise<any[]> {
    return this.prisma.company.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findByNip(nip: string): Promise<any | null> {
    return this.prisma.company.findUnique({ where: { nip } });
  }

  async findByRegon(regon: string): Promise<any | null> {
    return this.prisma.company.findUnique({ where: { regon } });
  }

  async findByUserIdWithCompanies(userId: string, companyId: string): Promise<any | null> {
    return this.prisma.company.findFirst({
      where: { id: companyId, userId },
    });
  }
}

// Repository factory
export class RepositoryFactory {
  constructor(private prisma: PrismaClient) {}

  get userRepository(): UserRepository {
    return new UserRepository(this.prisma);
  }

  get companyRepository(): CompanyRepository {
    return new CompanyRepository(this.prisma);
  }
}
