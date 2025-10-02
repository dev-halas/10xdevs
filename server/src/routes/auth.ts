import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../utils/db";
import { 
  ValidationSchemas, 
  DataNormalizers, 
  PasswordHelpers, 
  TokenHelpers, 
  UserHelpers, 
  ResponseValidators 
} from "../utils/helpers/auth-helpers";
import { handleError, ErrorFactory } from "../utils/error-handler";
import { createResponseBuilder } from "../utils/core/api-standards";
import { addToBlacklist } from "../utils/redis";
import { JWT_EXPIRES_IN_SECONDS } from "../utils/config";

export async function registerAuthRoutes(app: FastifyInstance): Promise<void> {
  // Register new user
  app.post("/api/auth/register", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = createResponseBuilder(reply);
      
      // Walidacja danych wejściowych
      const parsed = ValidationSchemas.register.parse(request.body);
      
      // Normalizacja danych
      const email = DataNormalizers.email(parsed.email);
      const phone = DataNormalizers.phone(parsed.phone);

      // Hashowanie hasła
      const passwordHash = await PasswordHelpers.hash(parsed.password);

      // Tworzenie użytkownika - polega na unikalnych indeksach (race-safe)
      const user = await prisma.user.create({
        data: { email, phone, passwordHash },
        select: { id: true, email: true, phone: true, createdAt: true },
      });

      // Walidacja odpowiedzi (tylko w dev)
      ResponseValidators.validateResponse(ResponseValidators.registerResponse, { user });

      return response.created(user, "Użytkownik został pomyślnie zarejestrowany");
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // User login
  app.post("/api/auth/login", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = createResponseBuilder(reply);
      
      // Walidacja danych wejściowych
      const parsed = ValidationSchemas.login.parse(request.body);
      
      // Normalizacja identyfikatora
      const { isEmail, normalized } = DataNormalizers.identifier(parsed.identifier);
      const where = isEmail 
        ? { email: normalized } 
        : { phone: normalized };

      // Znajdź użytkownika
      const user = await prisma.user.findUnique({
        where,
        select: { id: true, email: true, phone: true, passwordHash: true },
      });

      if (!user) {
        throw ErrorFactory.unauthorized("Nieprawidłowe dane logowania");
      }

      // Weryfikacja hasła
      const isPasswordValid = await PasswordHelpers.verify(parsed.password, user.passwordHash);
      if (!isPasswordValid) {
        throw ErrorFactory.unauthorized("Nieprawidłowe dane logowania");
      }

      // Generowanie tokenów
      const token = TokenHelpers.generateAccessToken(user.id);
      const { id: refreshTokenId, token: refreshToken } = await TokenHelpers.generateRefreshToken(user.id);

      const publicUser = UserHelpers.createPublicUser(user);
      
      // Walidacja odpowiedzi (tylko w dev)
      ResponseValidators.validateResponse(ResponseValidators.loginResponse, { 
        user: publicUser, 
        token, 
        refreshToken 
      });

      const loginData = { 
        user: publicUser, 
        token, 
        refreshToken, 
        refreshTokenId 
      };

      return response.ok(loginData, "Logowanie zakończone pomyślnie");
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // User logout
  app.post("/api/auth/logout", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = createResponseBuilder(reply);
      
      const body = ValidationSchemas.logout.refine(
        (data) => !data.refreshTokenId || data.refreshTokenId.trim().length > 0
      ).parse(request.body);

      // Jeśli użytkownik jest zalogowany i podał refreshTokenId, usuń go
      if (request.user?.id && body.refreshTokenId) {
        await TokenHelpers.revokeRefreshToken(request.user.id, body.refreshTokenId);
      }

      return response.ok(null, "Wylogowano");
    } catch (error) {
      return handleError(error, reply);
    }
  });

  // Refresh access token
  app.post("/api/auth/refresh", async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const response = createResponseBuilder(reply);
      
      const body = ValidationSchemas.refresh.parse(request.body);
      
      if (!request.user?.id) {
        throw ErrorFactory.unauthorized("Brak kontekstu użytkownika");
      }

      // Sprawdź czy refresh token jest prawidłowy
      const isValidRefreshToken = await TokenHelpers.verifyRefreshToken(
        request.user.id,
        body.refreshTokenId,
        body.refreshToken
      );

      if (!isValidRefreshToken) {
        throw ErrorFactory.unauthorized("Nieprawidłowy refresh token");
      }

      // Pobierz stary access token z nagłówka dla blacklistowania
      const auth = request.headers["authorization"];
      const oldToken = typeof auth === "string" ? auth.split(" ")[1] : null;

      // Usuń stary refresh token
      await TokenHelpers.revokeRefreshToken(request.user.id, body.refreshTokenId);

      // Generuj nowe tokeny
      const newAccessToken = TokenHelpers.generateAccessToken(request.user.id);
      const { id: newRefreshTokenId, token: newRefreshToken } = await TokenHelpers.generateRefreshToken(request.user.id);

      // Dodaj stary access token do blacklisty
      if (oldToken) {
        await addToBlacklist(oldToken, JWT_EXPIRES_IN_SECONDS);
      }

      const refreshData = { 
        token: newAccessToken, 
        refreshTokenId: newRefreshTokenId, 
        refreshToken: newRefreshToken 
      };

      return response.ok(refreshData, "Token został odświeżony");
    } catch (error) {
      return handleError(error, reply);
    }
  });
}


