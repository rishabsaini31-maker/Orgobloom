import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

// Redis client configuration
const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

// Create Redis client
const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error("Redis connection failed after 10 retries");
        return new Error("Redis connection failed");
      }
      // Exponential backoff
      return Math.min(retries * 100, 3000);
    },
  },
});

// Connect to Redis
let isConnected = false;

export const connectRedis = async (): Promise<void> => {
  if (isConnected) return;

  try {
    await redisClient.connect();
    isConnected = true;
    console.log("✅ Connected to Redis");
  } catch (error) {
    console.error("⚠️ Redis connection error:", error);
    console.log("⚠️ Continuing without Redis caching");
  }
};

// Handle Redis errors
redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
  isConnected = false;
});

redisClient.on("connect", () => {
  console.log("Redis Client Connected");
  isConnected = true;
});

redisClient.on("disconnect", () => {
  console.log("Redis Client Disconnected");
  isConnected = false;
});

// Cache utility functions
export const cache = {
  // Get value from cache
  async get<T>(key: string): Promise<T | null> {
    if (!isConnected) return null;
    try {
      const value = await redisClient.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  },

  // Set value in cache with expiry (default 1 hour)
  async set(
    key: string,
    value: any,
    expirySeconds: number = 3600,
  ): Promise<boolean> {
    if (!isConnected) return false;
    try {
      await redisClient.setEx(key, expirySeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error("Cache set error:", error);
      return false;
    }
  },

  // Delete key from cache
  async del(key: string): Promise<boolean> {
    if (!isConnected) return false;
    try {
      await redisClient.del(key);
      return true;
    } catch (error) {
      console.error("Cache del error:", error);
      return false;
    }
  },

  // Delete multiple keys matching pattern
  async delPattern(pattern: string): Promise<number> {
    if (!isConnected) return 0;
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length === 0) return 0;
      await redisClient.del(keys);
      return keys.length;
    } catch (error) {
      console.error("Cache delPattern error:", error);
      return 0;
    }
  },

  // Check if key exists
  async exists(key: string): Promise<boolean> {
    if (!isConnected) return false;
    try {
      const result = await redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error("Cache exists error:", error);
      return false;
    }
  },

  // Increment value
  async incr(key: string): Promise<number> {
    if (!isConnected) return 0;
    try {
      return await redisClient.incr(key);
    } catch (error) {
      console.error("Cache incr error:", error);
      return 0;
    }
  },

  // Set expiry on key
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!isConnected) return false;
    try {
      await redisClient.expire(key, seconds);
      return true;
    } catch (error) {
      console.error("Cache expire error:", error);
      return false;
    }
  },
};

// Session management for password reset codes
export const sessionStore = {
  // Store password reset code
  async setPasswordResetCode(email: string, code: string): Promise<boolean> {
    const key = `password_reset:${email}`;
    const data = {
      code,
      attempts: 0,
      createdAt: Date.now(),
    };
    // 10 minutes expiry
    return cache.set(key, data, 600);
  },

  // Get password reset code
  async getPasswordResetCode(
    email: string,
  ): Promise<{ code: string; attempts: number; createdAt: number } | null> {
    const key = `password_reset:${email}`;
    return cache.get<{ code: string; attempts: number; createdAt: number }>(
      key,
    );
  },

  // Increment attempts for password reset
  async incrementResetAttempts(email: string): Promise<number> {
    const key = `password_reset:${email}`;
    const data = await this.getPasswordResetCode(email);
    if (!data) return 0;

    data.attempts += 1;
    await cache.set(key, data, 600);
    return data.attempts;
  },

  // Delete password reset code
  async deletePasswordResetCode(email: string): Promise<boolean> {
    const key = `password_reset:${email}`;
    return cache.del(key);
  },

  // Store user session
  async setUserSession(
    userId: string,
    sessionData: any,
    expirySeconds: number = 86400,
  ): Promise<boolean> {
    const key = `session:${userId}`;
    return cache.set(key, sessionData, expirySeconds);
  },

  // Get user session
  async getUserSession(userId: string): Promise<any> {
    const key = `session:${userId}`;
    return cache.get(key);
  },

  // Delete user session
  async deleteUserSession(userId: string): Promise<boolean> {
    const key = `session:${userId}`;
    return cache.del(key);
  },
};

// Rate limiting store
export const rateLimitStore = {
  // Increment request count for IP
  async increment(ip: string, windowMs: number): Promise<number> {
    const key = `rate_limit:${ip}`;
    const current = await cache.incr(key);

    // Set expiry on first request
    if (current === 1) {
      await cache.expire(key, Math.floor(windowMs / 1000));
    }

    return current;
  },

  // Get current count for IP
  async getCount(ip: string): Promise<number> {
    const key = `rate_limit:${ip}`;
    const count = await cache.get<number>(key);
    return count || 0;
  },

  // Reset count for IP
  async reset(ip: string): Promise<boolean> {
    const key = `rate_limit:${ip}`;
    return cache.del(key);
  },
};

// Product cache helpers
export const productCache = {
  // Cache products list
  async getProducts(page: number, limit: number, search?: string) {
    const key = `products:${page}:${limit}:${search || "all"}`;
    return cache.get(key);
  },

  async setProducts(
    page: number,
    limit: number,
    data: any,
    search?: string,
    expirySeconds: number = 300,
  ) {
    const key = `products:${page}:${limit}:${search || "all"}`;
    return cache.set(key, data, expirySeconds);
  },

  async invalidateProducts() {
    return cache.delPattern("products:*");
  },

  // Cache single product
  async getProduct(id: string) {
    const key = `product:${id}`;
    return cache.get(key);
  },

  async setProduct(id: string, data: any, expirySeconds: number = 300) {
    const key = `product:${id}`;
    return cache.set(key, data, expirySeconds);
  },

  async invalidateProduct(id: string) {
    const key = `product:${id}`;
    return cache.del(key);
  },
};

export default {
  connectRedis,
  cache,
  sessionStore,
  rateLimitStore,
  productCache,
  isConnected: () => isConnected,
};
