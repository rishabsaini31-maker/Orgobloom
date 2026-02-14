/**
 * Fraud Detection Middleware
 * Protects checkout and sensitive endpoints
 * Provides modular, reusable middleware for clean routes
 */

import { db } from "../../db/index.js";
import { users } from "../../db/schema/index.js";
import { eq } from "drizzle-orm";
import { getUserFraudProfile } from "./fraud.service.js";

/**
 * Check fraud status before checkout
 * Blocks HIGH_RISK users, allows MEDIUM_RISK with COD disabled
 *
 * Usage: app.use('/api/checkout', fraudCheckoutMiddleware);
 */
export const fraudCheckoutMiddleware = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Fetch user fraud profile
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    console.log(
      `[FRAUD-MIDDLEWARE] Checkout check for user ${userId}: ${user.fraudStatus}`,
    );

    // HIGH_RISK users cannot checkout
    if (user.fraudStatus === "HIGH_RISK") {
      return res.status(403).json({
        error: "Checkout blocked due to fraud risk",
        fraudStatus: "HIGH_RISK",
        message:
          "Your account has been flagged for manual review. Please contact support.",
        requiresApproval: true,
      });
    }

    // MEDIUM_RISK users cannot use COD
    if (user.fraudStatus === "MEDIUM_RISK" && !user.codEnabled) {
      // Already disabled, continue
    }

    // Attach fraud info to request for downstream handlers
    req.fraud = {
      fraudStatus: user.fraudStatus,
      riskScore: user.riskScore,
      codEnabled: user.codEnabled,
      isBlocked: user.isBlocked,
    };

    next();
  } catch (error) {
    console.error("[FRAUD-MIDDLEWARE] Error in checkout middleware:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Add fraud info to existing user context
 * Useful for adding fraud status to responses
 *
 * Usage: app.use(enrichUserWithFraudStatus);
 */
export const enrichUserWithFraudStatus = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next();
    }

    const fraudProfile = await getUserFraudProfile(userId);
    req.fraudProfile = fraudProfile;

    next();
  } catch (error) {
    console.error("[FRAUD-MIDDLEWARE] Error enriching fraud status:", error);
    // Don't block request on error
    next();
  }
};

/**
 * Filter COD payment method based on fraud status
 * Removes COD option if user is MEDIUM_RISK or has codEnabled = false
 *
 * Usage: app.use(filterCODPaymentMethod);
 */
export const filterCODPaymentMethod = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next();
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return next();
    }

    // Store payment options info on request
    req.paymentOptions = {
      codAvailable:
        user.codEnabled &&
        user.fraudStatus !== "MEDIUM_RISK" &&
        user.fraudStatus !== "HIGH_RISK",
      onlinePaymentRequired:
        user.fraudStatus === "MEDIUM_RISK" || user.fraudStatus === "HIGH_RISK",
      reason: !user.codEnabled ? "COD disabled due to fraud risk" : undefined,
    };

    next();
  } catch (error) {
    console.error("[FRAUD-MIDDLEWARE] Error filtering COD:", error);
    next();
  }
};

/**
 * Rate limiting for login attempts
 * Prevents brute force attacks
 *
 * Usage: app.use('/api/auth/login', loginRateLimiter);
 */
export const loginRateLimiter = (req, res, next) => {
  // NOTE: This is a placeholder
  // In production, use express-rate-limit or similar package
  // with Redis backend for distributed rate limiting

  // For now, rely on the global apiLimiter in server.ts
  next();
};

/**
 * Rate limiting for checkout/order placement
 * Prevents rapid order placement
 *
 * Usage: app.use('/api/orders', checkoutRateLimiter);
 */
export const checkoutRateLimiter = (req, res, next) => {
  // NOTE: This is a placeholder
  // In production, implement with Redis-backed rate limiting
  // Limit: 3 orders per minute per user
  next();
};

/**
 * Log checkout attempt
 * Useful for audit trail
 *
 * Usage: app.use('/api/checkout', logCheckout);
 */
export const logCheckoutAttempt = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const method = req.method;
    const path = req.path;
    const timestamp = new Date().toISOString();

    console.log(
      `[CHECKOUT] ${method} ${path} - User: ${userId} at ${timestamp}`,
    );

    next();
  } catch (error) {
    console.error("[FRAUD-MIDDLEWARE] Error logging checkout:", error);
    next();
  }
};

/**
 * Validate device fingerprint consistency
 * Flags if user device changes frequently
 *
 * Usage: app.use(validateDeviceFingerprint);
 */
export const validateDeviceFingerprint = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const deviceFingerprint = req.body?.deviceFingerprint;

    if (!userId || !deviceFingerprint) {
      return next();
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return next();
    }

    // If user has existing device fingerprint and it differs
    if (
      user.deviceFingerprint &&
      user.deviceFingerprint !== deviceFingerprint
    ) {
      console.log(`[FRAUD] Device fingerprint mismatch for user ${userId}`);
      req.deviceMismatch = true;
    }

    next();
  } catch (error) {
    console.error("[FRAUD-MIDDLEWARE] Error validating device:", error);
    next();
  }
};

/**
 * Comprehensive fraud check middleware
 * Combines multiple checks
 *
 * Usage: app.use(comprehensiveFraudCheck);
 */
export const comprehensiveFraudCheck = async (req, res, next) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return next();
    }

    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) {
      return next();
    }

    // Collect fraud info
    const fraudInfo = {
      fraudStatus: user.fraudStatus,
      riskScore: user.riskScore,
      codEnabled: user.codEnabled,
      isBlocked: user.isBlocked,
      checks: {
        highRisk: user.fraudStatus === "HIGH_RISK",
        blocked: user.isBlocked,
        codDisabled: !user.codEnabled,
      },
    };

    // For sensitive operations (checkout), enforce HIGH_RISK block
    if (
      (req.path.includes("/checkout") || req.path.includes("/order")) &&
      fraudInfo.checks.highRisk
    ) {
      return res.status(403).json({
        error: "Operation blocked due to fraud risk",
        fraudStatus: user.fraudStatus,
        message:
          "This operation requires manual review. Please contact support.",
      });
    }

    // Attach to request context
    req.fraudInfo = fraudInfo;

    next();
  } catch (error) {
    console.error("[FRAUD-MIDDLEWARE] Error in comprehensive check:", error);
    next();
  }
};

export default {
  fraudCheckoutMiddleware,
  enrichUserWithFraudStatus,
  filterCODPaymentMethod,
  loginRateLimiter,
  checkoutRateLimiter,
  logCheckoutAttempt,
  validateDeviceFingerprint,
  comprehensiveFraudCheck,
};
