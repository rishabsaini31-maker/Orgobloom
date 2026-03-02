import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redisClient } from "../utils/redis.js";

// Helper to get consistent client IP even behind proxy
function getClientIP(req: any): string {
  // Check X-Forwarded-For first (for proxy scenarios like Render)
  const forwardedFor = req.get("x-forwarded-for");
  if (forwardedFor) {
    const ips = forwardedFor.split(",").map((ip: string) => ip.trim());
    return ips[0] || "unknown";
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

// Cache for Redis stores - created lazily on first use
const storeCache = new Map<string, RedisStore | null>();

// Helper to get or create Redis store with proper sendCommand
// Returns undefined if Redis isn't available, falling back to memory store
function getRedisStore(prefix: string) {
  // Return cached store if available
  if (storeCache.has(prefix)) {
    return storeCache.get(prefix) || undefined;
  }

  try {
    // Check if Redis is connected
    if (!redisClient.isReady) {
      console.warn(`⚠️  Redis not ready for ${prefix}, using memory store`);
      storeCache.set(prefix, null);
      return undefined; // Fallback to memory store
    }

    const store = new RedisStore({
      // @ts-expect-error - Redis store types mismatch
      client: redisClient,
      prefix: prefix,
      sendCommand: (...args: string[]) => redisClient.sendCommand(args),
    });

    console.log(`✅ Created Redis store for ${prefix}`);
    storeCache.set(prefix, store);
    return store;
  } catch (error) {
    console.warn(`⚠️  Redis store failed for ${prefix}:`, error);
    storeCache.set(prefix, null);
    return undefined; // Fallback to memory store
  }
}

// Rate limiter for login attempts
// Limits: 5 attempts per 15 minutes per IP
// Purpose: Prevent brute force attacks on login
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes per IP
  message: {
    error: "Too many login attempts",
    message: "Please try again after 15 minutes",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore("rl:login:"),
  handler: (req, res) => {
    console.log(`[RATE LIMIT] Login rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: "Too many login attempts",
      message: "Please try again after 15 minutes",
      retryAfter: "15 minutes",
    });
  },
});

// Rate limiter for registration
// Limits: 3 registrations per hour per IP
// Purpose: Prevent spam account creation
export const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    error: "Too many registration attempts",
    message: "Please try again after 1 hour",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore("rl:register:"),
  handler: (req, res) => {
    console.log(
      `[RATE LIMIT] Registration rate limit exceeded for IP: ${req.ip}`,
    );
    res.status(429).json({
      error: "Too many registration attempts",
      message: "Please try again after 1 hour",
      retryAfter: "1 hour",
    });
  },
});

// General API rate limiter
// Limits: 100 requests per 15 minutes per IP
// Purpose: General API protection
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"), // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "100"), // 100 requests per 15 minutes
  message: {
    error: "Too many requests",
    message: "Please try again later",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore("rl:api:"),
  handler: (req, res) => {
    console.log(
      `[RATE LIMIT] API rate limit exceeded for IP: ${req.ip} on ${req.method} ${req.path}`,
    );
    res.status(429).json({
      error: "Too many requests",
      message: "Please try again later",
    });
  },
});

// Order creation rate limiter
// Limits: 10 orders per hour per IP
// Purpose: Prevent order spam
export const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 orders per hour per IP
  message: {
    error: "Too many orders",
    message: "Please try again after 1 hour",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore("rl:order:"),
  handler: (req, res) => {
    console.log(`[RATE LIMIT] Order rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: "Too many orders",
      message: "Please try again after 1 hour",
      retryAfter: "1 hour",
    });
  },
});

// Password reset rate limiter
// Limits: 3 attempts per hour per IP
// Purpose: Prevent abuse of password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    error: "Too many password reset attempts",
    message: "Please try again after 1 hour",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: getRedisStore("rl:pwd-reset:"),
  keyGenerator: (req, res) => {
    const ip = getClientIP(req);
    console.log(`[RATE LIMIT DEBUG] Password reset attempt from IP: ${ip}`);
    return ip;
  },
  handler: (req, res) => {
    const ip = getClientIP(req);
    console.log(
      `[RATE LIMIT] ❌ Password reset blocked for IP: ${ip} - Too many attempts`,
    );
    res.status(429).json({
      error: "Too many password reset attempts",
      message: "Please try again after 1 hour",
      retryAfter: "1 hour",
    });
  },
});
