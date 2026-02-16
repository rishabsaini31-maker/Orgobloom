/**
 * Fraud Detection Feature Extraction Layer (ML-Ready)
 * Extracts structured, normalized features for ML training and model inference
 *
 * This layer ensures:
 * - Consistent feature definitions across rule-based and ML systems
 * - Normalized numerical values suitable for ML models
 * - Time-series features for behavioral analysis
 * - Structured data for streaming to Kafka/event stores
 */

import { db } from "../../db/index.js";
import { users, orders, fraudLogs } from "../../db/schema/index.js";
import { eq, and, gte, lt, desc, count, sql } from "drizzle-orm";

/**
 * Extract comprehensive fraud features from user and event data
 *
 * @param {string} userId - User ID to extract features for
 * @param {Object} db - Database connection
 * @param {Object} userData - Current user data (optional optimization)
 * @param {Object} metadata - Optional context metadata from event
 * @returns {Promise<Object>} Structured feature object
 */
export async function extractFraudFeatures(
  userId,
  database = db,
  userData = null,
  metadata = {},
) {
  try {
    // Calculate time references
    const nowTime = Date.now();
    const oneHourAgo = new Date(nowTime - 1 * 60 * 60 * 1000);
    const oneDayAgo = new Date(nowTime - 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(nowTime - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(nowTime - 30 * 24 * 60 * 60 * 1000);
    const oneYearAgo = new Date(nowTime - 365 * 24 * 60 * 60 * 1000);

    // Fetch user if not provided
    const user =
      userData ||
      (await database
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
        .then((result) => result[0]));

    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    // ============ ACCOUNT FEATURES ============
    const accountAgeMs = Math.max(
      0,
      nowTime - new Date(user.createdAt).getTime(),
    );
    const accountAgeHours = accountAgeMs / (1000 * 60 * 60);
    const accountAgeDays = accountAgeHours / 24;
    const accountAgeNorm = Math.min(1, accountAgeDays / 365);

    // ============ ORDERS & FINANCIAL FEATURES ============
    const userOrders = await database
      .select()
      .from(orders)
      .where(eq(orders.userId, userId));

    const totalOrderCount = userOrders.length;
    const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const avgOrderValue =
      totalOrderCount > 0 ? totalSpent / totalOrderCount : 0;
    const avgOrderValueNorm = Math.min(1, avgOrderValue / 50000);

    const orderValues = userOrders
      .map((o) => o.total || 0)
      .sort((a, b) => a - b);
    const maxOrderValue =
      orderValues.length > 0 ? orderValues[orderValues.length - 1] : 0;
    const minOrderValue = orderValues.length > 0 ? orderValues[0] : 0;

    const variance =
      orderValues.length > 1
        ? orderValues.reduce(
            (sum, val) => sum + Math.pow(val - avgOrderValue, 2),
            0,
          ) / orderValues.length
        : 0;
    const orderValueStdDev = Math.sqrt(variance);

    // ============ RETURN FEATURES ============
    const returnedOrders = userOrders.filter(
      (o) => o.status === "RETURNED" || o.status === "CANCELLED",
    );
    const totalReturnedOrders = returnedOrders.length;
    const returnRatio =
      totalOrderCount > 0 ? totalReturnedOrders / totalOrderCount : 0;
    const returnedAmount = returnedOrders.reduce(
      (sum, o) => sum + (o.total || 0),
      0,
    );
    const returnValueRatio = totalSpent > 0 ? returnedAmount / totalSpent : 0;

    // ============ PAYMENT FEATURES ============
    const failedPaymentLogs = await database
      .select()
      .from(fraudLogs)
      .where(
        and(
          eq(fraudLogs.userId, userId),
          eq(fraudLogs.eventType, "PAYMENT_FAILED"),
        ),
      );

    const totalPaymentAttempts = userOrders.filter(
      (o) => o.paymentMethod,
    ).length;
    const failedPaymentCount = failedPaymentLogs.length;
    const failedPaymentRate =
      totalPaymentAttempts > 0 ? failedPaymentCount / totalPaymentAttempts : 0;

    const lastPaymentFailure =
      failedPaymentLogs.length > 0
        ? new Date(failedPaymentLogs[0].createdAt)
        : null;
    const lastPaymentFailureRecent = lastPaymentFailure
      ? lastPaymentFailure > oneDayAgo
      : false;
    const daysSinceLastPaymentFailure = lastPaymentFailure
      ? (nowTime - lastPaymentFailure.getTime()) / (1000 * 60 * 60 * 24)
      : -1;

    // ============ VELOCITY FEATURES ============
    const loginEvents1h = await database
      .select()
      .from(fraudLogs)
      .where(
        and(
          eq(fraudLogs.userId, userId),
          eq(fraudLogs.eventType, "LOGIN"),
          gte(fraudLogs.createdAt, oneHourAgo),
        ),
      );

    const loginEvents24h = await database
      .select()
      .from(fraudLogs)
      .where(
        and(
          eq(fraudLogs.userId, userId),
          eq(fraudLogs.eventType, "LOGIN"),
          gte(fraudLogs.createdAt, oneDayAgo),
        ),
      );

    const orderEvents7d = userOrders.filter(
      (o) => new Date(o.createdAt) > sevenDaysAgo,
    );
    const orderEvents30d = userOrders.filter(
      (o) => new Date(o.createdAt) > thirtyDaysAgo,
    );

    // ============ DEVICE & LOCATION FEATURES ============
    const deviceFingerprint =
      metadata.deviceFingerprint || user.deviceFingerprint;
    const ipAddress = metadata.ipAddress || user.lastIPAddress;

    let deviceAccountCount = 0;
    if (deviceFingerprint) {
      const deviceUsers = await database
        .select()
        .from(users)
        .where(eq(users.deviceFingerprint, deviceFingerprint));
      deviceAccountCount = Math.max(0, deviceUsers.length - 1);
    }

    const ipCountryMismatchFlag = metadata.ipCountryMismatch || false;
    const lastIPChange =
      user.lastIPAddress && ipAddress && user.lastIPAddress !== ipAddress;
    const ipChangeRecent =
      lastIPChange && metadata.ipChangeDate
        ? new Date(metadata.ipChangeDate) > sevenDaysAgo
        : false;

    const ipCountryChangeFlag = metadata.ipCountryChange || false;
    const ipChangeLogs = await database
      .select()
      .from(fraudLogs)
      .where(
        and(
          eq(fraudLogs.userId, userId),
          gte(fraudLogs.createdAt, sevenDaysAgo),
        ),
      );
    const geoLocationStability = Math.max(0, 1 - ipChangeLogs.length / 10);

    // ============ COD FEATURES ============
    const codOrders = userOrders.filter((o) => o.paymentMethod === "COD");
    const totalCODOrders = codOrders.length;

    const codRejectionLogs = await database
      .select()
      .from(fraudLogs)
      .where(
        and(
          eq(fraudLogs.userId, userId),
          eq(fraudLogs.eventType, "COD_REJECTED"),
        ),
      );

    const codRejectionCount = codRejectionLogs.length;
    const codRejectionRate =
      totalCODOrders > 0 ? codRejectionCount / totalCODOrders : 0;
    const codSuccessCount = totalCODOrders - codRejectionCount;

    const lastCODAttempt =
      codOrders.length > 0
        ? new Date(codOrders[codOrders.length - 1].createdAt)
        : undefined;

    // ============ RISK HISTORY FEATURES ============
    const historicalRiskScore = user.riskScore || 0;
    const riskScoreNorm = Math.min(1, historicalRiskScore / 100);

    const recentRiskLogs = await database
      .select()
      .from(fraudLogs)
      .where(
        and(
          eq(fraudLogs.userId, userId),
          gte(fraudLogs.createdAt, sevenDaysAgo),
        ),
      );

    const olderRiskLogs = await database
      .select()
      .from(fraudLogs)
      .where(
        and(
          eq(fraudLogs.userId, userId),
          lt(fraudLogs.createdAt, sevenDaysAgo),
        ),
      );

    const recentRiskSum = recentRiskLogs.reduce(
      (sum, log) => sum + log.riskPoints,
      0,
    );
    const olderRiskSum = olderRiskLogs.reduce(
      (sum, log) => sum + log.riskPoints,
      0,
    );
    const riskScoreTrend =
      recentRiskSum === 0 && olderRiskSum === 0
        ? 0
        : olderRiskSum === 0
          ? 1
          : (recentRiskSum - olderRiskSum) / olderRiskSum;

    // Anomaly score
    const anomalyFeatures = [
      returnRatio > 0.3 ? 0.3 : 0,
      failedPaymentRate > 0.3 ? 0.3 : 0,
      loginEvents1h.length > 5 ? 0.25 : 0,
      deviceAccountCount > 5 ? 0.2 : 0,
      ipCountryMismatchFlag ? 0.2 : 0,
    ];
    const anomalyScore = Math.min(
      1,
      anomalyFeatures.reduce((a, b) => a + b, 0),
    );

    // Determine risk level
    let riskLevel = "SAFE";
    if (historicalRiskScore >= 60) {
      riskLevel = "HIGH_RISK";
    } else if (historicalRiskScore >= 30) {
      riskLevel = "MEDIUM_RISK";
    }

    // Return structured feature object
    return {
      accountAgeHours,
      accountAgeNorm,
      emailVerified: !!user.email,
      profileCompletion: 0.8,

      avgOrderValue,
      avgOrderValueNorm,
      totalOrderCount,
      totalSpent,
      maxOrderValue,
      minOrderValue,
      orderValueStdDev,

      totalReturnedOrders,
      returnRatio,
      returnValueRatio,

      totalPaymentAttempts,
      failedPaymentCount,
      failedPaymentRate,
      lastPaymentFailureRecent,
      daysSinceLastPaymentFailure,

      loginVelocity1h: loginEvents1h.length,
      loginVelocity24h: loginEvents24h.length,
      orderVelocity7d: orderEvents7d.length,
      orderVelocity30d: orderEvents30d.length,

      deviceAccountCount,
      ipCountryMismatchFlag,
      ipChangeRecent,
      ipCountryChangeFlag,
      geoLocationStability,

      totalCODOrders,
      codRejectionCount,
      codRejectionRate,
      codSuccessCount,
      lastCODAttempt,

      historicalRiskScore,
      riskScoreNorm,
      riskScoreTrend,

      anomalyScore,
      riskLevel,
    };
  } catch (error) {
    console.error(
      `[FRAUD FEATURES] Error extracting features for user ${userId}:`,
      error.message,
    );
    throw error;
  }
}

/**
 * Batch extract features for multiple users
 */
export async function extractBatchFeatures(userIds, database = db) {
  const results = {};

  for (const userId of userIds) {
    try {
      results[userId] = await extractFraudFeatures(userId, database);
    } catch (error) {
      console.error(`[FRAUD FEATURES] Failed for ${userId}:`, error.message);
      results[userId] = {};
    }
  }

  return results;
}

/**
 * Prepare training sample for ML export
 */
export function prepareTrainingSample(userId, features, actualFraudLabel) {
  return {
    userId,
    timestamp: new Date().toISOString(),
    label: actualFraudLabel,
    features: {
      accountAgeNorm: features.accountAgeNorm,
      avgOrderValueNorm: features.avgOrderValueNorm,
      returnRatio: features.returnRatio,
      failedPaymentRate: features.failedPaymentRate,
      loginVelocity1h: features.loginVelocity1h,
      deviceAccountCount: features.deviceAccountCount,
      ipCountryMismatchFlag: features.ipCountryMismatchFlag ? 1 : 0,
      codRejectionRate: features.codRejectionRate,
      riskScoreNorm: features.riskScoreNorm,
      anomalyScore: features.anomalyScore,
    },
  };
}
