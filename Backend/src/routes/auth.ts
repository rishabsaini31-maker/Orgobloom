import { Router, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema/index.js";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, generateToken } from "../utils/auth.js";
import { registerSchema, loginSchema } from "../utils/validations.js";
import { ApiError } from "../middleware/errorHandler.js";
import { AuthRequest } from "../middleware/auth.js";
import { OAuth2Client } from "google-auth-library";
import { sendEmail } from "../utils/emailService.js";
import { emailTemplates } from "../templates/emailTemplates.js";
import crypto from "crypto";
import rateLimit from "express-rate-limit";

// Define rate limiters locally to avoid import issues with rateLimiter.ts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per 15 minutes per IP
  message: {
    error: "Too many login attempts",
    message: "Please try again after 15 minutes",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(`[RATE LIMIT] Login rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: "Too many login attempts",
      message: "Please try again after 15 minutes",
      retryAfter: "15 minutes",
    });
  },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 registrations per hour per IP
  message: {
    error: "Too many registration attempts",
    message: "Please try again after 1 hour",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
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

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: {
    error: "Too many password reset attempts",
    message: "Please try again after 1 hour",
    retryAfter: "1 hour",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.log(
      `[RATE LIMIT] Password reset rate limit exceeded for IP: ${req.ip}`,
    );
    res.status(429).json({
      error: "Too many password reset attempts",
      message: "Please try again after 1 hour",
      retryAfter: "1 hour",
    });
  },
});

// In-memory store for password reset codes (email -> { code, expires, attempts })
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

// Register
router.post(
  "/register",
  registerLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validatedData = registerSchema.parse(req.body);

      // Check if user exists
      const existingUser = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1);

      if (existingUser.length > 0) {
        throw new ApiError("Email already registered", 400);
      }

      // Hash password
      const hashedPassword = await hashPassword(validatedData.password);

      // Create user
      const [newUser] = await db
        .insert(users)
        .values({
          email: validatedData.email,
          name: validatedData.name,
          password: hashedPassword,
          phone: validatedData.phone ?? null,
          provider: "email",
          providerAccountId: null,
          image: null,
          emailVerified: null,
          blockedAt: null,
          blockedReason: null,
          riskScore: 0,
          fraudStatus: "SAFE",
          codEnabled: true,
          lastIPAddress: null,
          deviceFingerprint: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Generate token
      const token = generateToken(newUser);

      // Send welcome email
      const welcomeEmailContent = emailTemplates.welcomeEmail(
        newUser.name || "User",
      );
      await sendEmail({
        to: newUser.email,
        subject: welcomeEmailContent.subject,
        html: welcomeEmailContent.html,
        text: welcomeEmailContent.text,
      }).catch((err) => console.error("Welcome email failed:", err));

      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;

      res.status(201).json({
        message: "Registration successful",
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Login
router.post(
  "/login",
  loginLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const validatedData = loginSchema.parse(req.body);

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, validatedData.email))
        .limit(1);

      if (!user) {
        throw new ApiError("Invalid email or password", 401);
      }

      // Check if user is blocked
      if (user.isBlocked) {
        throw new ApiError(
          "Your account has been blocked. Please contact support.",
          403,
        );
      }

      // Verify password
      if (!user.password) {
        throw new ApiError("Please use OAuth login method", 400);
      }

      const isValidPassword = await comparePassword(
        validatedData.password,
        user.password,
      );

      if (!isValidPassword) {
        throw new ApiError("Invalid email or password", 401);
      }

      // Generate token
      const token = generateToken(user);

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      // Debug logging
      console.log("🔍 Login successful for:", user.email);
      console.log("🔑 User role:", user.role);
      console.log(
        "👤 User data:",
        JSON.stringify(userWithoutPassword, null, 2),
      );

      res.json({
        message: "Login successful",
        user: userWithoutPassword,
        token,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Google OAuth
router.post(
  "/google",
  registerLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { token } = req.body;

      if (!token) {
        throw new ApiError("Google token is required", 400);
      }

      // Verify Google token
      const ticket = await googleClient.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();

      if (!payload || !payload.email) {
        throw new ApiError("Invalid Google token", 401);
      }

      const { email, name, picture, sub: googleId } = payload;

      // Check if this is the admin email
      const adminEmail = process.env.ADMIN_EMAIL || "orgobloom5033@gmail.com";
      const isAdmin = email === adminEmail;

      // Check if user exists
      let [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      // If user doesn't exist, create new user with Google login
      if (!existingUser) {
        const [newUser] = await db
          .insert(users)
          .values({
            email,
            name: name || email.split("@")[0],
            provider: "google",
            providerAccountId: googleId,
            image: picture,
            emailVerified: new Date(),
            // Grant ADMIN role if this is the admin email
            role: isAdmin ? "ADMIN" : "CUSTOMER",
            // No password for OAuth users
          })
          .returning();

        existingUser = newUser;
      } else if (!existingUser.provider || existingUser.provider === "email") {
        // Update existing email user to include Google OAuth
        const [updatedUser] = await db
          .update(users)
          .set({
            provider: "google",
            providerAccountId: googleId ?? null,
            image: (picture || existingUser.image) ?? null,
            emailVerified: existingUser.emailVerified || new Date(),
            role: isAdmin ? "ADMIN" : existingUser.role,
            phone: existingUser.phone ?? null,
            blockedAt: existingUser.blockedAt ?? null,
            blockedReason: existingUser.blockedReason ?? null,
            riskScore: existingUser.riskScore ?? 0,
            fraudStatus: existingUser.fraudStatus ?? "SAFE",
            codEnabled: existingUser.codEnabled ?? true,
            lastIPAddress: existingUser.lastIPAddress ?? null,
            deviceFingerprint: existingUser.deviceFingerprint ?? null,
            createdAt: existingUser.createdAt ?? new Date(),
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser.id))
          .returning();

        existingUser = updatedUser;
      }

      // Ensure admin user always has ADMIN role
      if (isAdmin && existingUser.role !== "ADMIN") {
        const [updatedUser] = await db
          .update(users)
          .set({ role: "ADMIN" })
          .where(eq(users.id, existingUser.id))
          .returning();
        existingUser = updatedUser;
      }

      // Check if user is blocked
      if (existingUser.isBlocked) {
        throw new ApiError(
          "Your account has been blocked. Please contact support.",
          403,
        );
      }

      // Generate token
      const authToken = generateToken(existingUser);

      // Remove password from response
      const { password, ...userWithoutPassword } = existingUser;

      res.json({
        message: "Google login successful",
        user: userWithoutPassword,
        token: authToken,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        next(error);
      } else {
        console.error("Google Auth Error:", error);
        next(new ApiError("Google authentication failed", 401));
      }
    }
  },
);

// Google OAuth Redirect (GET)
router.get("/google", (req, res) => {
  const admin = req.query.admin === "true";
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:8000/api/auth/google/callback";
  const scope = ["openid", "email", "profile"];
  const url = googleClient.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope,
    redirect_uri: redirectUri,
    state: admin ? "admin" : "customer",
  });
  res.redirect(url);
});

// Google OAuth Callback (GET)
router.get("/google/callback", async (req, res, next) => {
  try {
    const { code, state } = req.query;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      "http://localhost:8000/api/auth/google/callback";
    if (!code) {
      return res.status(400).json({ error: "Missing Google code" });
    }
    const { tokens } = await googleClient.getToken(code as string);
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.status(401).json({ error: "Invalid Google token" });
    }
    const { email, name, picture, sub: googleId } = payload;
    const adminEmail = process.env.ADMIN_EMAIL || "orgobloom5033@gmail.com";
    const isAdmin = state === "admin" && email === adminEmail;
    let [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (!existingUser) {
      const [newUser] = await db
        .insert(users)
        .values({
          email,
          name: name || email.split("@")[0],
          provider: "google",
          providerAccountId: googleId,
          image: picture,
          emailVerified: new Date(),
          role: isAdmin ? "ADMIN" : "CUSTOMER",
        })
        .returning();
      existingUser = newUser;
    } else if (!existingUser.provider || existingUser.provider === "email") {
      const [updatedUser] = await db
        .update(users)
        .set({
          provider: "google",
          providerAccountId: googleId ?? null,
          image: (picture || existingUser.image) ?? null,
          emailVerified: existingUser.emailVerified || new Date(),
          role: isAdmin ? "ADMIN" : existingUser.role,
          phone: existingUser.phone ?? null,
          blockedAt: existingUser.blockedAt ?? null,
          blockedReason: existingUser.blockedReason ?? null,
          riskScore: existingUser.riskScore ?? 0,
          fraudStatus: existingUser.fraudStatus ?? "SAFE",
          codEnabled: existingUser.codEnabled ?? true,
          lastIPAddress: existingUser.lastIPAddress ?? null,
          deviceFingerprint: existingUser.deviceFingerprint ?? null,
          createdAt: existingUser.createdAt ?? new Date(),
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning();
      existingUser = updatedUser;
    }
    if (isAdmin && existingUser.role !== "ADMIN") {
      const [updatedUser] = await db
        .update(users)
        .set({ role: "ADMIN" })
        .where(eq(users.id, existingUser.id))
        .returning();
      existingUser = updatedUser;
    }
    if (existingUser.isBlocked) {
      return res.status(403).json({
        error: "Your account has been blocked. Please contact support.",
      });
    }
    const authToken = generateToken(existingUser);
    const { password, ...userWithoutPassword } = existingUser;
    // Redirect to admin dashboard with token (or send token as response)
    // For demo: send token in query string
    const frontendUrl =
      process.env.ADMIN_FRONTEND_URL || "http://localhost:3002/dashboard";
    res.redirect(`${frontendUrl}?token=${authToken}`);
  } catch (error) {
    next(error);
  }
});

// Forgot Password - Send verification code

router.post(
  "/forgot-password",
  passwordResetLimiter,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;

      if (!email) {
        throw new ApiError("Email is required", 400);
      }

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      // Don't reveal if email exists or not (security)
      if (!user) {
        return res.json({
          message: "If this email exists, a verification code has been sent.",
        });
      }

      // Generate 6-digit code
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000,
      ).toString();

      // Store code with 10-minute expiry
      resetCodes.set(email, {
        code: verificationCode,
        expires: Date.now() + 600000, // 10 minutes
        attempts: 0,
      });

      // Send verification code email
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">Password Reset Code</h2>
          <p>Hi ${user.name},</p>
          <p>You requested to reset your password. Use this code to proceed:</p>
          
          <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #667eea; letter-spacing: 5px; margin: 0;">${verificationCode}</h1>
            <p style="color: #999; margin: 10px 0 0 0;">This code expires in 10 minutes</p>
          </div>

          <p><strong>How to use:</strong></p>
          <ol>
            <li>Go to ${process.env.FRONTEND_URL}/forgot-password</li>
            <li>Enter the code above: <strong>${verificationCode}</strong></li>
            <li>Create your new password</li>
          </ol>

          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject: "Your Password Reset Code is: " + verificationCode,
        html: emailContent,
        text: `Password Reset Code: ${verificationCode}\n\nThis code expires in 10 minutes. Do not share this code with anyone.`,
      }).catch((err) => console.error("Email failed:", err));

      res.json({
        message: "If this email exists, a verification code has been sent.",
      });
    } catch (error) {
      next(error);
    }
  },
);

// Verify code
router.post(
  "/verify-code",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        throw new ApiError("Email and code are required", 400);
      }

      const stored = resetCodes.get(email);

      if (!stored) {
        throw new ApiError(
          "No reset code found. Please request a new one.",
          400,
        );
      }

      // Check if code expired
      if (Date.now() > stored.expires) {
        resetCodes.delete(email);
        throw new ApiError(
          "Verification code has expired. Please request a new one.",
          400,
        );
      }

      // Check attempt limit
      if (stored.attempts >= 5) {
        resetCodes.delete(email);
        throw new ApiError(
          "Too many failed attempts. Please request a new code.",
          400,
        );
      }

      // Verify code
      if (stored.code !== code.toString().trim()) {
        stored.attempts++;
        throw new ApiError("Invalid verification code", 400);
      }

      res.json({
        message: "Code verified successfully",
        valid: true,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Reset Password with code
router.post(
  "/reset-password",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { email, code, newPassword, confirmPassword } = req.body;

      if (!email || !code || !newPassword || !confirmPassword) {
        throw new ApiError("All fields are required", 400);
      }

      // Verify code first
      const stored = resetCodes.get(email);

      if (!stored) {
        throw new ApiError(
          "No reset code found. Please request a new one.",
          400,
        );
      }

      if (Date.now() > stored.expires) {
        resetCodes.delete(email);
        throw new ApiError(
          "Verification code has expired. Please request a new one.",
          400,
        );
      }

      if (stored.code !== code.toString().trim()) {
        stored.attempts++;
        throw new ApiError("Invalid verification code", 400);
      }

      // Validate passwords
      if (newPassword !== confirmPassword) {
        throw new ApiError("Passwords do not match", 400);
      }

      if (newPassword.length < 8) {
        throw new ApiError("Password must be at least 8 characters", 400);
      }

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        throw new ApiError("User not found", 404);
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await db
        .update(users)
        .set({ password: hashedPassword })
        .where(eq(users.id, user.id));

      // Clear code
      resetCodes.delete(email);

      res.json({
        message:
          "Password reset successful. Please sign in with your new password.",
      });
    } catch (error) {
      next(error);
    }
  },
);

// Create admin user endpoint (for initial setup - can be disabled in production)
router.post(
  "/create-admin",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Security check - only allow if no admin exists or with secret key
      const secretKey = req.body.secretKey || req.headers["x-admin-secret"];
      const validSecret =
        process.env.ADMIN_SECRET_KEY || "orgobloom-admin-2024";

      if (secretKey !== validSecret) {
        throw new ApiError("Unauthorized", 401);
      }

      const adminEmail = process.env.ADMIN_EMAIL || "orgobloom5033@gmail.com";
      const adminPassword = process.env.ADMIN_PASSWORD || "orgobloom5033@@$";

      // Check if admin already exists
      const [existingAdmin] = await db
        .select()
        .from(users)
        .where(eq(users.email, adminEmail))
        .limit(1);

      if (existingAdmin) {
        // Update the existing user to ADMIN role
        const [updatedUser] = await db
          .update(users)
          .set({
            role: "ADMIN",
            password: await hashPassword(adminPassword),
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingAdmin.id))
          .returning();

        const { password, ...userWithoutPassword } = updatedUser;
        return res.json({
          message: "Admin user updated successfully",
          user: userWithoutPassword,
        });
      }

      // Create new admin user
      const hashedPassword = await hashPassword(adminPassword);

      const [newAdmin] = await db
        .insert(users)
        .values({
          email: adminEmail,
          name: "Admin",
          password: hashedPassword,
          role: "ADMIN",
          emailVerified: new Date(),
        })
        .returning();

      const { password, ...userWithoutPassword } = newAdmin;

      res.status(201).json({
        message: "Admin user created successfully",
        user: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
