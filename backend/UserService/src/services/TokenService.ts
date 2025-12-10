import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { getRedisClient } from './RedisService';
import JWTPayload from '../models/JWTInterface';

const REFRESH_EXPIRES_SECONDS = parseInt(
  process.env.JWT_REFRESH_EXPIRES_SECONDS || '604800',
  10
); // 7 days
const COOKIE_NAME = process.env.REFRESH_TOKEN_COOKIE_NAME || 'refreshToken';

// Create JWT access token
export const createAccessToken = (payload: object) => {
  return jwt.sign(payload as JWTPayload, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: '2m',
  });
};

// Create opaque refresh token (random) and store hashed in Redis (keyed by userId)
export const createAndStoreRefreshToken = async (userId: string) => {
  const raw = crypto.randomBytes(64).toString('hex');
  const hashed = await bcrypt.hash(raw, 10);

  const redis = getRedisClient();
  const key = `refresh:${userId}`;

  // store hashed token with expiry
  await redis.set(key, hashed, { EX: REFRESH_EXPIRES_SECONDS });

  return { raw, expiresIn: REFRESH_EXPIRES_SECONDS };
};

// Verify a presented refresh token against stored (hashed) one in Redis
export const verifyRefreshToken = async (userId: string, presented: string) => {
  const redis = getRedisClient();
  const key = `refresh:${userId}`;
  const storedHashed = await redis.get(key);
  if (!storedHashed) return false;
  const ok = await bcrypt.compare(presented, storedHashed);
  return ok;
};

// Revoke refresh token (delete key)
export const revokeRefreshToken = async (userId: string) => {
  const redis = getRedisClient();
  const key = `refresh:${userId}`;
  await redis.del(key);
};
