/**
 * Fraud Detection Service (ML-Ready)
 * Core business logic for evaluating user fraud risk
 * Event-driven risk calculation with modular rules
 * Horizontally scalable - all state stored in DB
 *
 * MAJOR ENHANCEMENTS:
 * - Abstract scoring strategies (rule-based, ML-based, hybrid)
 * - Feature extraction layer for ML training
 * - Event normalization for streaming (Kafka-compatible)
 * - Stateless architecture for horizontal scaling
 * - Event publishing for real-time alerts and data pipelines
 *
 * Architecture:
 *   1. Feature Extraction → Normalize user data for ML
 *   2. Score Calculation → Apply scoring strategy (rule/ML/hybrid)
 *   3. Event Normalization → Structure for streaming
 *   4. Database Persistence → Update user risk
 *   5. Event Publishing → Stream to Kafka/alerting
 */

import { db } from "../../db/index.js";
import {
  users,
  fraudLogs,
  orders,
  orderItems,
  fraudStatusEnum,
} from "../../db/schema/index.js";
import { eq, and, gte, lte, count, sql, desc } from "drizzle-orm";
import {
  FRAUD_RULES,
  FAILED_PAYMENT_RULE,
  COD_ABUSE_RULE,
  RETURN_ABUSE_RULE,
  MULTI_ACCOUNT_DEVICE_RULE,
  VELOCITY_RULE,
  IP_MISMATCH_RULE,
  ACCOUNT_AGE_RULE,
  HIGH_ORDER_VALUE_RULE,
  EMAIL_VERIFICATION_RULE,
  getFraudStatus,
  RISK_THRESHOLDS,
} from "./fraud.rules.js";
import {
  getClientIP,
  getMinutesDifference,
  parseShippingAddress,
  getCountryFromIP,
  generateDeviceFingerprint,
  sanitizeMetadata,
  applyRiskDecay,
  isWithinTimeWindow,
} from "./fraud.utils.js";

// ML-Ready imports (async to avoid circular dependencies)
let scoringStrategyFactory = null;
let eventPublisher = null;
let featuresModule = null;
let eventsModule = null;

async function initializeMLModules() {
  if (scoringStrategyFactory) return; // Already initialized

  try {
    const scoringModule = await import("./fraud.scoring.js");
    scoringStrategyFactory = scoringModule.ScoringStrategyFactory;

    const features = await import("./fraud.features.js");
    featuresModule = features;

    const events = await import("./fraud.events.js");
    eventsModule = events;

    console.log("[FRAUD SERVICE] ML modules initialized successfully");
  } catch (error) {
    console.warn(
      "[FRAUD SERVICE] Could not initialize ML modules:",
      error.message,
    );
  }
}

/**
 * Main fraud risk evaluation function
 * Now with ML-ready architecture: Feature extraction → Scoring strategy → Event publishing
 *
 * @param {string} userId - User ID to evaluate
 * @param {string} eventType - Type of event (LOGIN, ORDER_PLACED, etc)
 * @param {Object} metadata - Event-specific data
 * @param {Object} options - Advanced options (strategy='RULE', publishEvents=true)
 * @returns {Object} - Evaluation result with risk points and new score
 */
export const evaluateFraudRisk = async (
  userId,
  eventType,
  metadata = {},
  options = {},
) => {
  const startTime = Date.now();

  try {
    if (!userId) throw new Error("userId is required");
    if (!eventType) throw new Error("eventType is required");

    await initializeMLModules();

    // Fetch current user data
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) throw new Error("User not found");

    console.log(`[FRAUD SERVICE] Evaluating ${eventType} for user ${userId}`);

    // ============ STEP 1: FEATURE EXTRACTION (ML-Ready) ============
    let features = null;
    if (featuresModule) {
      try {
        features = await featuresModule.extractFraudFeatures(
          userId,
          db,
          user,
          metadata,
        );
      } catch (error) {
        console.warn(
          `[FRAUD SERVICE] Feature extraction failed:`,
          error.message,
        );
      }
    }

    // ============ STEP 2: CALCULATE RISK SCORE ============
    // Use strategy pattern for flexible scoring (rule-based, ML, hybrid)
    const strategy = options.strategy || "RULE";
    let riskResult;

    if (scoringStrategyFactory && features) {
      try {
        // Use abstract scoring strategy
        const scoringStrategy = scoringStrategyFactory.create(strategy);
        riskResult = await scoringStrategy.calculateRisk(
          userId,
          eventType,
          features,
          metadata,
        );

        console.log(
          `[FRAUD SERVICE] Used ${scoringStrategy.getStrategyName()}`,
        );
      } catch (error) {
        console.warn(
          `[FRAUD SERVICE] Strategy scoring failed, falling back to legacy rules:`,
          error.message,
        );
        // Fallback to legacy rule-based evaluation
        const legacy = await evaluateLegacyRisk(user, eventType, metadata);
        riskResult = {
          totalRiskScore: legacy.totalRiskPoints,
          riskPoints: legacy.totalRiskPoints,
          fraudStatus: getFraudStatus(legacy.totalRiskPoints),
          riskFactors: legacy.reasons.map((r) => ({
            name: r,
            impact: 0,
            reason: r,
          })),
          codDisable: legacy.codDisable || false,
          strategy: "RuleBasedLegacy",
          version: "0.99.0",
          confidence: 0.8,
          executionTimeMs: Date.now() - startTime,
          reasons: legacy.reasons,
        };
      }
    } else {
      // No ML modules available, use legacy evaluation
      const legacy = await evaluateLegacyRisk(user, eventType, metadata);
      riskResult = {
        totalRiskScore: legacy.totalRiskPoints,
        riskPoints: legacy.totalRiskPoints,
        fraudStatus: getFraudStatus(legacy.totalRiskPoints),
        riskFactors: legacy.reasons.map((r) => ({
          name: r,
          impact: 0,
          reason: r,
        })),
        codDisable: legacy.codDisable || false,
        strategy: "RuleBasedLegacy",
        version: "0.99.0",
        confidence: 0.8,
        executionTimeMs: Date.now() - startTime,
        reasons: legacy.reasons,
      };
    }

    const fraudStatus =
      riskResult.fraudStatus || getFraudStatus(riskResult.totalRiskScore);
    const totalRiskPoints = riskResult.totalRiskScore;

    // ============ STEP 3: CREATE NORMALIZED EVENT (Kafka-Ready) ============
    let normalizedEvent = null;
    if (eventsModule && features && options.publishEvents !== false) {
      try {
        normalizedEvent = eventsModule.createNormalizedEvent(
          userId,
          eventType,
          riskResult,
          metadata,
          features,
          Date.now() - startTime,
        );
      } catch (error) {
        console.warn(
          `[FRAUD SERVICE] Event normalization failed:`,
          error.message,
        );
      }
    }

    // ============ STEP 4: PERSIST TO DATABASE ============
    // Calculate new risk score (with decay applied)
    const decayedCurrentScore = applyRiskDecay(user.riskScore, user.updatedAt);
    const newRiskScore = Math.max(0, decayedCurrentScore + totalRiskPoints);

    const newFraudStatus = getFraudStatus(newRiskScore);

    console.log(
      `[FRAUD SERVICE] Risk calc: +${totalRiskPoints} points | Score: ${newRiskScore} | Status: ${newFraudStatus}`,
    );

    // Create fraud log entry
    if (totalRiskPoints > 0) {
      await db.insert(fraudLogs).values({
        userId,
        eventType,
        riskPoints: totalRiskPoints,
        reason: riskResult.reasons?.join("; ") || "Risk score calculated",
        metadata: sanitizeMetadata(metadata),
      });
    }

    // Update user risk score and fraud status
    let updateData = {
      riskScore: newRiskScore,
      fraudStatus: newFraudStatus,
      updatedAt: new Date(),
    };

    // Update lastIPAddress if provided
    if (metadata.ipAddress) {
      updateData.lastIPAddress = metadata.ipAddress;
    }

    // Update deviceFingerprint if provided
    if (metadata.deviceFingerprint) {
      updateData.deviceFingerprint = metadata.deviceFingerprint;
    }

    // Disable COD if needed
    if (riskResult.codDisable) {
      updateData.codEnabled = false;
    }

    await db.update(users).set(updateData).where(eq(users.id, userId));

    // ============ STEP 5: PUBLISH EVENT (Kafka/Streaming) ============
    if (normalizedEvent && eventPublisher && options.publishEvents !== false) {
      try {
        await eventPublisher.publish(normalizedEvent);

        // Publish high-risk alert if needed
        if (fraudStatus === "HIGH_RISK") {
          await eventPublisher.publishAlert(normalizedEvent, "HIGH");
        }
      } catch (error) {
        console.warn(`[FRAUD SERVICE] Event publishing failed:`, error.message);
        // Continue anyway - don't block the fraud check
      }
    }

    // ============ RETURN RESULT ============
    return {
      success: true,
      userId,
      eventType,
      riskPointsAdded: totalRiskPoints,
      newRiskScore,
      previousRiskScore: user.riskScore,
      fraudStatus: newFraudStatus,
      codEnabled: updateData.codEnabled ?? user.codEnabled,
      reasons: riskResult.reasons || [],
      metadata: sanitizeMetadata(metadata),
      strategy: riskResult.strategy,
      confidence: riskResult.confidence,
      executionTimeMs: Date.now() - startTime,
      eventId: normalizedEvent?.eventId,
    };
  } catch (error) {
    console.error("[FRAUD SERVICE] Error evaluating risk:", error);
    throw error;
  }
};

/**
 * Legacy rule-based risk evaluation (fallback when ML unavailable)
 * Maintains backward compatibility
 */
async function evaluateLegacyRisk(user, eventType, metadata) {
  let totalRiskPoints = 0;
  let reasons = [];
  let codDisable = false;

  // Evaluate based on event type
  switch (eventType) {
    case "LOGIN":
      ({ totalRiskPoints, reasons } = await evaluateLoginRisk(user, metadata));
      break;

    case "ORDER_PLACED":
      ({ totalRiskPoints, reasons, codDisable } = await evaluateOrderPlacedRisk(
        user,
        metadata,
      ));
      break;

    case "PAYMENT_FAILED":
      ({ totalRiskPoints, reasons } = await evaluatePaymentFailedRisk(
        user,
        metadata,
      ));
      break;

    case "RETURN_REQUESTED":
      ({ totalRiskPoints, reasons } = await evaluateReturnRequestedRisk(
        user,
        metadata,
      ));
      break;

    case "COD_REJECTED":
      ({ totalRiskPoints, reasons, codDisable } = await evaluateCODRejectedRisk(
        user,
        metadata,
      ));
      break;

    default:
      console.warn(`Unknown event type: ${eventType}`);
  }

  return { totalRiskPoints, reasons, codDisable };
}

/**
 * Set external event publisher for streaming
 * Allows injection of Kafka or custom event handlers
 */
export const setEventPublisher = (publisher) => {
  eventPublisher = publisher;
  console.log("[FRAUD SERVICE] Event publisher configured");
};

/**
 * Get features for a user (for ML model inference)
 * Useful for manual debugging or model testing
 */
export const getUserFeatures = async (userId) => {
  if (!featuresModule) {
    throw new Error("Features module not available");
  }

  return await featuresModule.extractFraudFeatures(userId, db);
};

/**
 * Generate training data export
 * Aggregates events with features for ML model training
 */
export const generateTrainingDataExport = async (userIds = null) => {
  if (!eventsModule || !featuresModule) {
    throw new Error("Event or features module not available");
  }

  let queryUsers = userIds;
  if (!userIds) {
    // Get all users with fraud events
    const result = await db
      .select({ userId: fraudLogs.userId })
      .from(fraudLogs)
      .distinct();
    queryUsers = result.map((r) => r.userId);
  }

  const features = await featuresModule.extractBatchFeatures(queryUsers, db);
  const logs = await db.select().from(fraudLogs).limit(10000);

  return eventsModule.generateTrainingDataExport(logs);
};

/**
 * Create event stream manager for publishing
 * Supports multiple publishers with fallback
 */
export const createEventStreamManager = () => {
  if (!eventsModule) {
    throw new Error("Events module not available");
  }

  const manager = new eventsModule.EventStreamManager();
  manager.addPublisher(new eventsModule.InMemoryEventPublisher());
  return manager;
};

/**
 * Evaluate LOGIN event
 */
async function evaluateLoginRisk(user, metadata) {
  let riskPoints = 0;
  let reasons = [];

  // Account age check
  const accountAgeRisk = ACCOUNT_AGE_RULE.evaluate(user);
  if (accountAgeRisk > 0) {
    riskPoints += accountAgeRisk;
    reasons.push(ACCOUNT_AGE_RULE.reason);
  }

  // IP mismatch check
  if (metadata.ipAddress && metadata.lastIPAddress) {
    const ipMismatchRisk = IP_MISMATCH_RULE.evaluate(
      metadata.ipAddress,
      metadata.lastIPAddress,
    );
    if (ipMismatchRisk > 0) {
      riskPoints += ipMismatchRisk;
      reasons.push(IP_MISMATCH_RULE.reason);
    }
  }

  // Velocity check - login attempts
  if (metadata.loginAttempts && metadata.loginAttempts >= 10) {
    const velocity = VELOCITY_RULE.evaluate("login", 10, 2);
    if (velocity.riskPoints > 0) {
      riskPoints += velocity.riskPoints;
      reasons.push(velocity.reason);
    }
  }

  // Email verification
  if (!user.emailVerified) {
    const emailRisk = EMAIL_VERIFICATION_RULE.evaluate(false);
    if (emailRisk > 0) {
      riskPoints += emailRisk;
      reasons.push(EMAIL_VERIFICATION_RULE.reason);
    }
  }

  // Device fingerprint abuse check
  if (metadata.deviceFingerprint) {
    const accountCountForDevice = await getAccountCountForDeviceFingerprint(
      metadata.deviceFingerprint,
    );
    const multiDeviceRisk = MULTI_ACCOUNT_DEVICE_RULE.evaluate(
      accountCountForDevice,
    );
    if (multiDeviceRisk > 0) {
      riskPoints += multiDeviceRisk;
      reasons.push(MULTI_ACCOUNT_DEVICE_RULE.reason);
    }
  }

  return { totalRiskPoints: riskPoints, reasons };
}

/**
 * Evaluate ORDER_PLACED event
 */
async function evaluateOrderPlacedRisk(user, metadata) {
  let riskPoints = 0;
  let reasons = [];
  let codDisable = false;

  // High order value check
  const orderValueRisk = HIGH_ORDER_VALUE_RULE.evaluate(metadata.order);
  if (orderValueRisk > 0) {
    riskPoints += orderValueRisk;
    reasons.push(HIGH_ORDER_VALUE_RULE.reason);
  }

  // Velocity check - rapid orders
  if (metadata.recentOrderCount && metadata.recentOrderCount >= 5) {
    const velocity = VELOCITY_RULE.evaluate("orders", 5, 5);
    if (velocity.riskPoints > 0) {
      riskPoints += velocity.riskPoints;
      reasons.push(velocity.reason);
    }
  }

  // IP vs Shipping country mismatch
  if (metadata.ipAddress && metadata.shippingCountry) {
    const ipCountry = await getCountryFromIP(metadata.ipAddress);
    const mismatchRisk = IP_MISMATCH_RULE.evaluate(
      ipCountry,
      metadata.shippingCountry,
    );
    if (mismatchRisk > 0) {
      riskPoints += mismatchRisk;
      reasons.push(IP_MISMATCH_RULE.reason);
    }
  }

  return { totalRiskPoints: riskPoints, reasons, codDisable };
}

/**
 * Evaluate PAYMENT_FAILED event
 */
async function evaluatePaymentFailedRisk(user, metadata) {
  let riskPoints = 0;
  let reasons = [];

  // Count failed payments in last 1 hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const [result] = await db
    .select({ count: count() })
    .from(fraudLogs)
    .where(
      and(
        eq(fraudLogs.userId, user.id),
        eq(fraudLogs.eventType, "PAYMENT_FAILED"),
        gte(fraudLogs.createdAt, oneHourAgo),
      ),
    );

  const failedPaymentCount = result.count + 1; // +1 for current attempt

  const paymentRisk = FAILED_PAYMENT_RULE.evaluate(failedPaymentCount);
  if (paymentRisk > 0) {
    riskPoints += paymentRisk;
    reasons.push(FAILED_PAYMENT_RULE.reason);
  }

  return { totalRiskPoints: riskPoints, reasons };
}

/**
 * Evaluate RETURN_REQUESTED event
 */
async function evaluateReturnRequestedRisk(user, metadata) {
  let riskPoints = 0;
  let reasons = [];

  // Calculate return ratio
  const [totalResult] = await db
    .select({ count: count() })
    .from(orders)
    .where(eq(orders.userId, user.id));

  const totalOrders = totalResult.count;

  const [returnResult] = await db
    .select({ count: count() })
    .from(orders)
    .where(
      and(
        eq(orders.userId, user.id),
        sql`${orders.status} = 'CANCELLED' OR ${orders.cancelledAt} IS NOT NULL`,
      ),
    );

  const returnedOrders = returnResult.count;

  const returnRisk = RETURN_ABUSE_RULE.evaluate(totalOrders, returnedOrders);
  if (returnRisk > 0) {
    riskPoints += returnRisk;
    reasons.push(RETURN_ABUSE_RULE.reason);
  }

  return { totalRiskPoints: riskPoints, reasons };
}

/**
 * Evaluate COD_REJECTED event
 */
async function evaluateCODRejectedRisk(user, metadata) {
  let riskPoints = 0;
  let reasons = [];
  let codDisable = false;

  // Count COD rejections
  const codRejectionCount = await getCODRejectionCount(user.id);
  const codRisk = COD_ABUSE_RULE.evaluate(codRejectionCount + 1); // +1 for current

  if (codRisk > 0) {
    riskPoints += codRisk;
    reasons.push(COD_ABUSE_RULE.reason);
  }

  // Disable COD if threshold reached
  if (COD_ABUSE_RULE.disableCOD(codRejectionCount + 1)) {
    codDisable = true;
  }

  return { totalRiskPoints: riskPoints, reasons, codDisable };
}

/**
 * Get account count for a device fingerprint
 * Used to detect fraud networks using same device
 */
async function getAccountCountForDeviceFingerprint(deviceFingerprint) {
  if (!deviceFingerprint) return 0;

  const [result] = await db
    .select({ count: count() })
    .from(users)
    .where(eq(users.deviceFingerprint, deviceFingerprint));

  return result.count;
}

/**
 * Get COD rejection count for user
 */
async function getCODRejectionCount(userId) {
  const [result] = await db
    .select({ count: count() })
    .from(fraudLogs)
    .where(
      and(
        eq(fraudLogs.userId, userId),
        eq(fraudLogs.eventType, "COD_REJECTED"),
      ),
    );

  return result.count;
}

/**
 * Get fraud logs for a user
 */
export const getUserFraudLogs = async (userId, limit = 50) => {
  try {
    const logs = await db
      .select()
      .from(fraudLogs)
      .where(eq(fraudLogs.userId, userId))
      .orderBy(desc(fraudLogs.createdAt))
      .limit(limit);

    return logs;
  } catch (error) {
    console.error("[FRAUD] Error fetching fraud logs:", error);
    throw error;
  }
};

/**
 * Get all high-risk users
 * Used for admin dashboard
 */
export const getHighRiskUsers = async (limit = 100) => {
  try {
    const highRiskUsers = await db
      .select()
      .from(users)
      .where(eq(users.fraudStatus, "HIGH_RISK"))
      .orderBy(desc(users.riskScore))
      .limit(limit);

    return highRiskUsers;
  } catch (error) {
    console.error("[FRAUD] Error fetching high-risk users:", error);
    throw error;
  }
};

/**
 * Get all medium-risk users
 */
export const getMediumRiskUsers = async (limit = 100) => {
  try {
    const mediumRiskUsers = await db
      .select()
      .from(users)
      .where(eq(users.fraudStatus, "MEDIUM_RISK"))
      .orderBy(desc(users.riskScore))
      .limit(limit);

    return mediumRiskUsers;
  } catch (error) {
    console.error("[FRAUD] Error fetching medium-risk users:", error);
    throw error;
  }
};

/**
 * Get user fraud profile
 */
export const getUserFraudProfile = async (userId) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId));

    if (!user) throw new Error("User not found");

    const logs = await getUserFraudLogs(userId);

    return {
      userId,
      riskScore: user.riskScore,
      fraudStatus: user.fraudStatus,
      codEnabled: user.codEnabled,
      isBlocked: user.isBlocked,
      deviceFingerprint: user.deviceFingerprint,
      lastIPAddress: user.lastIPAddress,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      recentEvents: logs.slice(0, 10),
      totalEvents: logs.length,
    };
  } catch (error) {
    console.error("[FRAUD] Error fetching user fraud profile:", error);
    throw error;
  }
};

/**
 * Reset user risk score
 * Called by admin after manual review
 */
export const resetUserRiskScore = async (userId, reason = "") => {
  try {
    await db
      .update(users)
      .set({
        riskScore: 0,
        fraudStatus: "SAFE",
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Log the reset action
    await db.insert(fraudLogs).values({
      userId,
      eventType: "LOGIN", // Using generic event
      riskPoints: -1,
      reason: `Admin reset risk score: ${reason}`,
      metadata: { admin_action: true },
    });

    return {
      success: true,
      message: "Risk score reset successfully",
    };
  } catch (error) {
    console.error("[FRAUD] Error resetting risk score:", error);
    throw error;
  }
};

export default {
  evaluateFraudRisk,
  getUserFraudLogs,
  getHighRiskUsers,
  getMediumRiskUsers,
  getUserFraudProfile,
  resetUserRiskScore,
};
