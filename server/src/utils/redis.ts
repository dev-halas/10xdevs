import Redis from "ioredis";
import { REDIS_URL } from "./config";

export const redis = new Redis(REDIS_URL);

export function buildRefreshTokenKey(userId: string, tokenId: string): string {
  return `rt:${userId}:${tokenId}`;
}

export function buildBlacklistKey(token: string): string {
  return `blacklist:${token}`;
}

export async function addToBlacklist(token: string, ttlSeconds: number): Promise<void> {
  await redis.set(buildBlacklistKey(token), "1", "EX", ttlSeconds);
}

export async function isBlacklisted(token: string): Promise<boolean> {
  return (await redis.get(buildBlacklistKey(token))) === "1";
}


