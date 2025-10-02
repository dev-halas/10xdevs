import { z } from "zod";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { BCRYPT_SALT_ROUNDS, JWT_SECRET, JWT_EXPIRES_IN_SECONDS, REFRESH_TOKEN_TTL_SECONDS } from "../config";
import { redis, buildRefreshTokenKey } from "../redis";

// Schematy walidacji raz jeszcze w jednym miejscu
export const ValidationSchemas = {
  register: z.object({
    email: z.string().min(1, "E-mail jest wymagany").email("Nieprawidłowy format e-mail"),
    phone: z.string()
      .min(6, "Numer telefonu musi mieć min. 6 znaków")
      .max(20, "Numer telefonu może mieć max. 20 znaków")
      .regex(/^[+0-9][0-9\-\s]*$/, "Nieprawidłowy format numeru telefonu"),
    password: z.string()
      .min(8, "Hasło musi mieć min. 8 znaków")
      .regex(/[a-z]/, "Hasło musi zawierać małą literę")
      .regex(/[A-Z]/, "Hasło musi zawierać wielką literę")
      .regex(/[0-9]/, "Hasło musi zawierać cyfrę")
      .regex(/[^A-Za-z0-9]/, "Hasło musi zawierać znak specjalny"),
  }),

  login: z.object({
    identifier: z.string().min(3, "E-mail lub telefon musi mieć min. 3 znaki"),
    password: z.string().min(8, "Hasło musi mieć min. 8 znaków"),
  }),

  logout: z.object({
    refreshTokenId: z.string().optional(),
  }),

  refresh: z.object({
    refreshTokenId: z.string("Refresh token ID jest wymagane"),
    refreshToken: z.string("Refresh token jest wymagany"),
  }),
};

// Funkcje normalizacji danych
export const DataNormalizers = {
  email: (email: string): string => email.trim().toLowerCase(),
  
  phone: (phone: string): string => {
    const compact = phone.trim().replace(/[\s\-]/g, "");
    return compact;
  },

  identifier: (identifier: string): { isEmail: boolean; normalized: string } => {
    const trimmed = identifier.trim();
    const isEmail = /@/.test(trimmed);
    const normalized = isEmail ? DataNormalizers.email(trimmed) : DataNormalizers.phone(trimmed);
    
    return { isEmail, normalized };
  },
};

// Funkcje związane z hasłem
export const PasswordHelpers = {
  hash: async (password: string): Promise<string> => {
    return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
  },

  verify: async (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash);
  },
};

// Funkcje związane z tokenami JWT
export const TokenHelpers = {
  generateAccessToken: (userId: string): string => {
    return jwt.sign({ sub: userId }, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN_SECONDS 
    });
  },

  generateRefreshToken: async (userId: string): Promise<{ 
    id: string; 
    token: string; 
  }> => {
    const id = crypto.randomUUID();
    const token = crypto.randomBytes(48).toString("hex");
    const key = buildRefreshTokenKey(userId, id);
    
    await redis.set(key, token, "EX", REFRESH_TOKEN_TTL_SECONDS);
    
    return { id, token };
  },

  verifyRefreshToken: async (
    userId: string, 
    refreshTokenId: string, 
    refreshToken: string
  ): Promise<boolean> => {
    const key = buildRefreshTokenKey(userId, refreshTokenId);
    const stored = await redis.get(key);
    
    return Boolean(stored && stored === refreshToken);
  },

  revokeRefreshToken: async (userId: string, refreshTokenId: string): Promise<void> => {
    const key = buildRefreshTokenKey(userId, refreshTokenId);
    await redis.del(key);
  },
};

// Funkcje związane z użytkownikiem
export const UserHelpers = {
  sanitizeUser: <T extends { passwordHash?: any }>(user: T): Omit<T, 'passwordHash'> => {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  },

  createPublicUser: (user: { id: string; email: string; phone: string }) => ({
    id: user.id,
    email: user.email, 
    phone: user.phone,
  }),
};

// Funkcje walidacji odpowiedzi (dev only)
export const ResponseValidators = {
  registerResponse: z.object({
    user: z.object({
      id: z.string(),
      email: z.string().email(),
      phone: z.string(),
      createdAt: z.date(),
    }),
  }),

  loginResponse: z.object({
    user: z.object({ 
      id: z.string(), 
      email: z.string().email(), 
      phone: z.string() 
    }),
    token: z.string(),
    refreshToken: z.string(),
  }),

  validateResponse: <T>(schema: z.ZodSchema<T>, data: unknown): T | null => {
    if (process.env.NODE_ENV !== "production") {
      try {
        return schema.parse(data);
      } catch {
        console.warn("Response validation failed");
        return null;
      }
    }
    return data as T;
  },
};
