
## 📖 **API Development Guide - Krótki Przewodnik**

Ponieważ nie mogę bezpośrednio zapisywać plików, przygotowałem dla Ciebie kompletny guide w formie struktury. Oto kluczowe elementy jak tworzyć chronione endpoint-y:

### 🎯 **Najprostszy chroniony endpoint:**

```typescript
// routes/example.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { requireAuth } from "../plugins/auth";
import { handleError } from "../utils/error-handler";
import { createResponseBuilder } from "../utils/core/api-standards";
import { AuthUtils } from "../plugins/auth";

export async function registerExampleRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/example", { preHandler: requireAuth }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = createResponseBuilder(reply);
      const userId = AuthUtils.requireUserId(request);
      
      // Your business logic here
      const data = { userId, message: "Hello!" };
      
      return response.ok(data, "Success!");
    } catch (error) {
      return handleError(error, reply);
    }
  });
}
```

### 🔧 **Kluczowe importy dla nowych endpoint-ów:**

1. **Authentication & Authorization:**
   ```typescript
   import { requireAuth } from "../plugins/auth";
   import { AuthUtils } from "../plugins/auth";
   ```

2. **Response & Error Handling:**
   ```typescript
   import { createResponseBuilder } from "../utils/core/api-standards";
   import { handleError } from "../utils/error-handler";
   ```

3. **Pagination (jeśli potrzebne):**
   ```typescript
   import { PaginationHelpers } from "../utils/core/pagination";
   ```

4. **Validation:**
   ```typescript
   import { z } from "zod";
   ```

### 📋 **Standardowe wzorce:**

#### **GET endpoint:**
```typescript
app.get("/api/resource", { preHandler: requireAuth }, async (request, reply) => {
  try {
    const response = createResponseBuilder(reply);
    const userId = AuthUtils.requireUserId(request);
    
    const data = await fetchUserData(userId);
    return response.ok(data, "Data fetched successfully");
  } catch (error) {
    return handleError(error, reply);
  }
});
```

#### **POST endpoint (CREATE):**
```typescript
app.post("/api/resource", { preHandler: requireAuth }, async (request, reply) => {
  try {
    const response = createResponseBuilder(reply);
    const userId = AuthUtils.requireUserId(request);
    
    const validatedData = YourSchema.parse(request.body);
    const newResource = await createResource({...validatedData, userId});
    
    return response.created(newResource, "Resource created successfully");
  } catch (error) {
    return handleError(error, reply);
  }
});
```

#### **PUT endpoint (UPDATE):**
```typescript
app.put("/api/resource/:id", { preHandler: requireAuth }, async (request, reply) => {
  try {
    const response = createResponseBuilder(reply);
    const userId = AuthUtils.requireUserId(request);
    const { id } = parseParamsSchema.parse(request.params);
    
    // Check ownership
    await ensureUserOwnsResource(userId, id);
    
    const validatedData = updateSchema.parse(request.body);
    const updated = await updateResource(id, validatedData);
    
    return response.ok(updated, "Resource updated successfully");
  } catch (error) {
    return handleError(error, reply);
  }
});
```

#### **DELETE endpoint:**
```typescript
app.delete("/api/resource/:id", { preHandler: requireAuth }, async (request, reply) => {
  try {
    const response = createResponseBuilder(reply);
    const userId = AuthUtils.requireUserId(request);
    const { id } = paramSchema.parse(request.params);
    
    // Check ownership
    await ensureUserOwnsResource(userId, id);
    
    await deleteResource(id);
    return response.ok(null, "Resource deleted successfully");
  } catch (error) {
    return handleError(error, reply);
  }
});
```

### 🔐 **Authentication patterns:**

#### **Podstawowe sprawdzenie auth:**
```typescript
const userId = AuthUtils.requireUserId(request); // Throws jeśli brak auth
```

#### **Bezpieczne sprawdzenie auth:**
```typescript
if (AuthUtils.isAuthenticated(request)) {
  const userId = AuthUtils.getUserId(request); // Może być null
  // Logic for authenticated users
} else {
  // Logic for guests
}
```

#### **Access control:**
```typescript
// Ensure user owns resource
const resource = await prisma.resource.findFirst({
  where: { id, userId }
});

if (!resource) {
  return response.notFound("Resource not found or access denied");
}
```

### 📄 **Pagination template:**

```typescript
// Parse pagination
const paginationInfo = PaginationHelpers.parseParams(request.query);
const queryInfo = {
  ...paginationInfo,
  skip: PaginationHelpers.calculateSkip(paginationInfo.page, paginationInfo.limit),
};

// Validate sort fields
PaginationHelpers.validateSortableFields(queryInfo.sortBy, ['createdAt', 'name']);

// Get data
const [data, totalCount] = await Promise.all([
  prisma.resource.findMany({
    where: { userId },
    skip: queryInfo.skip,
    take: queryInfo.limit,
    orderBy: PaginationHelpers.createOrderBy(queryInfo.sortBy, queryInfo.sortOrder),
  }),
  prisma.resource.count({ where: { userId } })
]);

// Build response
const pagination = PaginationHelpers.buildPaginationResponse(data, totalCount, queryInfo);
return response.paginated(pagination.data, pagination.pagination);
```

### 🏗️ **Helper file structure:**

```typescript
// utils/helpers/resource-helpers.ts
export const ResourceValidationSchemas = {
  create: z.object({ /* schema */ }),
  update: z.object({ /* schema */ }),
  params: z.object({ id: z.string().min(1) }),
};

export const ResourceAccessControl = {
  ensureUserOwnsResource: async (userId: string, resourceId: string, prisma: any) => {
    const resource = await prisma.resource.findFirst({ where: { id: resourceId, userId } });
    if (!resource) throw ErrorFactory.notFound("Resource not found");
    return resource;
  },
};
```

### 🎯 **Kluczowe punkty do zapamiętania:**

1. **Always use:** `createResponseBuilder(reply)` for responses
2. **Always use:** `AuthUtils.requireUserId(request)` instead of `request.user?.id`
3. **Always use:** `handleError(error, reply)` for error handling  
4. **Always check:** ownership before modifying user resources
5. **Always validate:** input data with Zod schemas
6. **Don't forget:** `preHandler: requireAuth` on protected endpoints

### 📚 **Żywe przykłady w kodzie:**

- **Auth routes:** `src/routes/auth.ts` - Login, register, refresh
- **Company CRUD:** `src/routes/companies.ts` - Peak example 
- **Dashboard:** `src/routes/dashboard.ts` - Simple protected endpoint
- **Users:** `src/routes/users.ts` - Pagination + search

**Wszystko gotowe do tworzenia nowych endpoint-ów! 🚀**