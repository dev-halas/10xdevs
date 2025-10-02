import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),
  JWT_SECRET: z.string().min(32, "JWT_SECRET musi mieć min. 32 znaki"),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().min(60).max(60 * 60 * 24 * 7).default(15 * 60),
  REDIS_URL: z.string().url().default("redis://localhost:6379"),
  REFRESH_TOKEN_TTL_SECONDS: z.coerce.number().int().min(60).max(60 * 60 * 24 * 30).default(60 * 60 * 24 * 7),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Build a compact error message for missing/invalid envs
  const issues = parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join(", ");
  throw new Error(`Invalid environment variables: ${issues}`);
}

export const PORT = parsed.data.PORT;
export const NODE_ENV = parsed.data.NODE_ENV;
export const BCRYPT_SALT_ROUNDS = parsed.data.BCRYPT_SALT_ROUNDS;
export const JWT_SECRET = parsed.data.JWT_SECRET;
export const JWT_EXPIRES_IN_SECONDS = parsed.data.JWT_EXPIRES_IN_SECONDS;
export const REDIS_URL = parsed.data.REDIS_URL;
export const REFRESH_TOKEN_TTL_SECONDS = parsed.data.REFRESH_TOKEN_TTL_SECONDS;


