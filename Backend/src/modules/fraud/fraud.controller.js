/**
 * Fraud Detection Controller
 * Handles admin API endpoints for fraud management
 * RESTful endpoints for viewing, managing high-risk users
 */

import {
  getUserFraudProfile,
  getHighRiskUsers,
  getMediumRiskUsers,
  resetUserRiskScore,
} from "./fraud.service.js";
import { db } from "../../db/index.js";
import { users, fraudLogs } from "../../db/schema/index.js";
import { eq, desc } from "drizzle-orm";

/**
 * GET /admin/fraud
 * Get fraud detection summary
 */
export const getFraudSummary = async (req, res) => {
  try {
    const [highRiskResult] = await db
      .select()
      .from(users)
      .where(eq(users.fraudStatus, "HIGH_RISK"))
      .then((users) => [{ count: users.length }]);

    const [mediumRiskResult] = await db
      .select()
      .from(users)
      .where(eq(users.fraudStatus, "MEDIUM_RISK"))
      .then((users) => [{ count: users.length }]);

    // Get recent fraud events (last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentEvents = await db
      .select()
      .from(fraudLogs)
      .where(undefined) // Placeholder - drizzle doesn't have a .gte for created_at in this context
      .orderBy(desc(fraudLogs.createdAt))
      .limit(100);

    const summary = {
      highRiskUsers: highRiskResult?.count || 0,
      mediumRiskUsers: mediumRiskResult?.count || 0,
      recentEventsLast24h: recentEvents.filter(
        (e) => new Date(e.createdAt) > twentyFourHoursAgo,
      ).length,
      totalFraudEventsLogged: recentEvents.length,
    };

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error("Error getting fraud summary:", error);
    res.status(500).json({ error: "Failed to fetch fraud summary" });
  }
};

/**
 * GET /admin/fraud/high-risk
 * Get all high-risk users with pagination
 */
export const getHighRiskUsersList = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const highRiskUsers = await getHighRiskUsers(Math.min(limit, 100));

    const response = {
      success: true,
      data: highRiskUsers.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        riskScore: user.riskScore,
        fraudStatus: user.fraudStatus,
        codEnabled: user.codEnabled,
        isBlocked: user.isBlocked,
        lastIPAddress: user.lastIPAddress,
        deviceFingerprint: user.deviceFingerprint,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      count: highRiskUsers.length,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching high-risk users:", error);
    res.status(500).json({ error: "Failed to fetch high-risk users" });
  }
};

/**
 * GET /admin/fraud/medium-risk
 * Get all medium-risk users
 */
export const getMediumRiskUsersList = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const mediumRiskUsers = await getMediumRiskUsers(Math.min(limit, 100));

    const response = {
      success: true,
      data: mediumRiskUsers.map((user) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        riskScore: user.riskScore,
        fraudStatus: user.fraudStatus,
        codEnabled: user.codEnabled,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })),
      count: mediumRiskUsers.length,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching medium-risk users:", error);
    res.status(500).json({ error: "Failed to fetch medium-risk users" });
  }
};

/**
 * GET /admin/fraud/user/:userId
 * Get detailed fraud profile for a user
 */
export const getUserFraudProfileEndpoint = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const fraudProfile = await getUserFraudProfile(userId);

    res.json({
      success: true,
      data: fraudProfile,
    });
  } catch (error) {
    console.error("Error fetching user fraud profile:", error);

    if (error.message === "User not found") {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(500).json({ error: "Failed to fetch user fraud profile" });
  }
};

/**
 * GET /admin/fraud/events/:userId
 * Get fraud events for a user with detailed logs
 */
export const getUserFraudEvents = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const events = await db
      .select()
      .from(fraudLogs)
      .where(eq(fraudLogs.userId, userId))
      .orderBy(desc(fraudLogs.createdAt))
      .limit(Math.min(limit, 100));

    res.json({
      success: true,
      data: {
        userId,
        totalEvents: events.length,
        events: events.map((event) => ({
          id: event.id,
          eventType: event.eventType,
          riskPoints: event.riskPoints,
          reason: event.reason,
          metadata: event.metadata,
          timestamp: event.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching user fraud events:", error);
    res.status(500).json({ error: "Failed to fetch user fraud events" });
  }
};

/**
 * PATCH /admin/fraud/block/:userId
 * Block a user (already done by customer blocking, but fraud-specific endpoint)
 */
export const blockUserForFraud = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const blockReason =
      reason || "Blocked due to fraud risk - requires manual review";

    const [updated] = await db
      .update(users)
      .set({
        isBlocked: true,
        blockedAt: new Date(),
        blockedReason: blockReason,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: "User blocked successfully",
      data: {
        userId,
        isBlocked: updated.isBlocked,
        blockReason: updated.blockedReason,
      },
    });
  } catch (error) {
    console.error("Error blocking user:", error);
    res.status(500).json({ error: "Failed to block user" });
  }
};

/**
 * PATCH /admin/fraud/unblock/:userId
 * Unblock a user
 */
export const unblockUserForFraud = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const [updated] = await db
      .update(users)
      .set({
        isBlocked: false,
        blockedAt: null,
        blockedReason: null,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: "User unblocked successfully",
      data: {
        userId,
        isBlocked: updated.isBlocked,
      },
    });
  } catch (error) {
    console.error("Error unblocking user:", error);
    res.status(500).json({ error: "Failed to unblock user" });
  }
};

/**
 * PATCH /admin/fraud/reset-score/:userId
 * Reset risk score to SAFE (after manual review)
 */
export const resetUserFraudScore = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const result = await resetUserRiskScore(
      userId,
      reason || "Manual admin reset",
    );

    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    res.json({
      success: true,
      message: result.message,
      data: {
        userId,
        riskScore: updatedUser.riskScore,
        fraudStatus: updatedUser.fraudStatus,
      },
    });
  } catch (error) {
    console.error("Error resetting fraud score:", error);
    res.status(500).json({ error: "Failed to reset fraud score" });
  }
};

/**
 * PATCH /admin/fraud/enable-cod/:userId
 * Re-enable COD for a user
 */
export const enableCODForUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const [updated] = await db
      .update(users)
      .set({
        codEnabled: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: "COD enabled for user",
      data: {
        userId,
        codEnabled: updated.codEnabled,
      },
    });
  } catch (error) {
    console.error("Error enabling COD:", error);
    res.status(500).json({ error: "Failed to enable COD" });
  }
};

/**
 * PATCH /admin/fraud/disable-cod/:userId
 * Disable COD for a user
 */
export const disableCODForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const [updated] = await db
      .update(users)
      .set({
        codEnabled: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: "User not found" });
    }

    // Log this action
    await db.insert(fraudLogs).values({
      userId,
      eventType: "LOGIN",
      riskPoints: 0,
      reason: `Admin disabled COD: ${reason || "No reason provided"}`,
      metadata: { admin_action: true },
    });

    res.json({
      success: true,
      message: "COD disabled for user",
      data: {
        userId,
        codEnabled: updated.codEnabled,
      },
    });
  } catch (error) {
    console.error("Error disabling COD:", error);
    res.status(500).json({ error: "Failed to disable COD" });
  }
};

export default {
  getFraudSummary,
  getHighRiskUsersList,
  getMediumRiskUsersList,
  getUserFraudProfileEndpoint,
  getUserFraudEvents,
  blockUserForFraud,
  unblockUserForFraud,
  resetUserFraudScore,
  enableCODForUser,
  disableCODForUser,
};
