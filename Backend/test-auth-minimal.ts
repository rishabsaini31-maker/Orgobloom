import { Router, Response, NextFunction } from "express";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, generateToken } from "@/utils/auth";
import { registerSchema, loginSchema } from "@/utils/validations";
import { ApiError } from "@/middleware/errorHandler";
import {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
} from "@/middleware/rateLimiter";
import { AuthRequest } from "@/middleware/auth";
import { OAuth2Client } from "google-auth-library";
import { sendEmail } from "@/utils/emailService";
import { emailTemplates } from "@/templates/emailTemplates";
import crypto from "crypto";

const resetCodes: Map<
  string,
  { code: string; expires: number; attempts: number }
> = new Map();

const router = Router();

// Initialize Google OAuth Client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || "",
  process.env.GOOGLE_CLIENT_SECRET || "",
);

// Just test one route
console.log("Creating POST route for /forgot-password");
console.log("passwordResetLimiter type:", typeof passwordResetLimiter);

router.post(
  "/forgot-password",
  passwordResetLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    res.json({ test: true });
  },
);

console.log("Route created successfully");
export default router;
