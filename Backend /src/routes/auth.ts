import { Router } from "express";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { hashPassword, comparePassword, generateToken } from "@/utils/auth";
import { registerSchema, loginSchema } from "@/utils/validations";
import { ApiError } from "@/middleware/errorHandler";
import { loginLimiter, registerLimiter } from "@/middleware/rateLimiter";
import { OAuth2Client } from "google-auth-library";
import { triggerLoginFraudCheck } from "@/modules/fraud/fraud.integration";

const router = Router();

// Initialize Google OAuth Client
const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID || "",
  process.env.GOOGLE_CLIENT_SECRET || "",
);

// Register
router.post("/register", registerLimiter, async (req, res, next) => {
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
        phone: validatedData.phone,
      })
      .returning();

    // Generate token
    const token = generateToken(newUser);

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
});

// Login
router.post("/login", loginLimiter, async (req, res, next) => {
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

    // Note: Fraud check runs async in background - doesn't block login
    // This is temporary until the fraud module is fully debugged
    setImmediate(() => {
      triggerLoginFraudCheck(req, user.id, user.email).catch((err) => {
        console.error("[AUTH] Background fraud check failed:", err.message);
      });
    });

    res.json({
      message: "Login successful",
      user: userWithoutPassword,
      token,
    });
  } catch (error) {
    next(error);
  }
});

// Google OAuth
router.post("/google", registerLimiter, async (req, res, next) => {
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
          providerAccountId: googleId,
          image: picture || existingUser.image,
          emailVerified: existingUser.emailVerified || new Date(),
        })
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

    // Trigger fraud risk evaluation on login
    const fraudCheck = await triggerLoginFraudCheck(
      req,
      existingUser.id,
      existingUser.email,
    );

    // Fetch updated user with fraud status
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, existingUser.id));

    const { password: _, ...userWithFraud } = updatedUser;

    res.json({
      message: "Google login successful",
      user: userWithFraud,
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
});

export default router;
