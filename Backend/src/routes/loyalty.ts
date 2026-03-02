// @ts-nocheck
import { Router, Response } from "express";
import { db } from "../db/index.js";
import {
  loyaltyPoints,
  loyaltyTiers,
  userLoyalty,
} from "../db/schema/loyalty.js";
import { authenticate, isAdmin, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";
import { eq, desc, sql, asc } from "drizzle-orm";

const router = Router();

async function getOrCreateDefaultTier() {
  const existingTier = await db
    .select()
    .from(loyaltyTiers)
    .orderBy(asc(loyaltyTiers.minPoints))
    .limit(1);

  if (existingTier[0]) {
    return existingTier[0];
  }

  const created = await db
    .insert(loyaltyTiers)
    .values({
      name: "BRONZE",
      minPoints: 0,
      maxPoints: 999,
      pointsMultiplier: 1,
      discountPercent: 0,
      freeShipping: null,
    })
    .returning();

  return created[0];
}

/**
 * @route   GET /api/loyalty/my-account
 * @desc    Get user's loyalty account details
 * @access  Authenticated users
 */
router.get(
  "/my-account",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.user?.id || "";

      let account = await db.query.userLoyalty.findFirst({
        where: (row) => eq(row.userId, userId),
      });

      if (!account) {
        const defaultTier = await getOrCreateDefaultTier();
        const created = await db
          .insert(userLoyalty)
          .values({
            userId,
            totalPointsEarned: 0,
            currentBalance: 0,
            tierId: defaultTier.id,
            totalRedeemed: 0,
            totalExpired: 0,
            updatedAt: new Date(),
          })
          .returning();
        account = created[0];
      }

      const transactions = await db
        .select()
        .from(loyaltyPoints)
        .where(eq(loyaltyPoints.userId, userId))
        .orderBy(desc(loyaltyPoints.createdAt))
        .limit(20);

      const tierInfo = account.tierId
        ? (
            await db
              .select()
              .from(loyaltyTiers)
              .where(eq(loyaltyTiers.id, account.tierId))
              .limit(1)
          )[0]
        : null;

      res.json({
        account,
        recentTransactions: transactions,
        tierInfo,
      });
    } catch (error) {
      logger.error("Failed to fetch loyalty account", { error });
      res.status(500).json({ error: "Failed to fetch loyalty account" });
    }
  },
);

/**
 * @route   GET /api/loyalty/rewards
 * @desc    Get available loyalty rewards (placeholder)
 * @access  Authenticated users
 */
router.get(
  "/rewards",
  authenticate,
  async (_req: AuthRequest, res: Response) => {
    try {
      res.json([]);
    } catch (error) {
      logger.error("Failed to fetch rewards", { error });
      res.status(500).json({ error: "Failed to fetch rewards" });
    }
  },
);

/**
 * @route   POST /api/loyalty/redeem
 * @desc    Redeem loyalty reward (currently unavailable)
 * @access  Authenticated users
 */
router.post(
  "/redeem",
  authenticate,
  async (_req: AuthRequest, res: Response) => {
    res.status(501).json({
      error: "Reward redemption is not configured yet",
    });
  },
);

/**
 * @route   GET /api/loyalty/admin/dashboard
 * @desc    Get loyalty program dashboard analytics
 * @access  Admin only
 */
router.get(
  "/admin/dashboard",
  authenticate,
  isAdmin,
  async (_req: AuthRequest, res: Response) => {
    try {
      const totalMembers = await db
        .select({ count: sql`count(*)` })
        .from(userLoyalty);

      const membersByTier = await db
        .select({
          tier: loyaltyTiers.name,
          count: sql`count(*)`,
        })
        .from(userLoyalty)
        .leftJoin(loyaltyTiers, eq(userLoyalty.tierId, loyaltyTiers.id))
        .groupBy(loyaltyTiers.name);

      const totalPointsInCirculation = await db
        .select({ totalPoints: sql`sum(${userLoyalty.currentBalance})` })
        .from(userLoyalty);

      const avgPointsByTier = await db
        .select({
          tier: loyaltyTiers.name,
          avgPoints: sql`avg(${userLoyalty.currentBalance})`,
        })
        .from(userLoyalty)
        .leftJoin(loyaltyTiers, eq(userLoyalty.tierId, loyaltyTiers.id))
        .groupBy(loyaltyTiers.name);

      res.json({
        summary: {
          totalMembers: Number(totalMembers[0]?.count || 0),
          totalActiveRewards: 0,
          totalPointsInCirculation: Number(
            totalPointsInCirculation[0]?.totalPoints || 0,
          ),
        },
        membersByTier,
        avgPointsByTier,
      });
    } catch (error) {
      logger.error("Failed to fetch loyalty dashboard", { error });
      res.status(500).json({ error: "Failed to fetch dashboard" });
    }
  },
);

/**
 * @route   POST /api/loyalty/admin/tiers
 * @desc    Create/Update loyalty tier
 * @access  Admin only
 */
router.post(
  "/admin/tiers",
  authenticate,
  isAdmin,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        name,
        minPointsRequired,
        discountPercentage,
        pointsMultiplier,
        maxPoints,
      } = req.body;

      if (
        !name ||
        minPointsRequired === undefined ||
        discountPercentage === undefined
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const existingTier = await db
        .select()
        .from(loyaltyTiers)
        .where(eq(loyaltyTiers.name, String(name)))
        .limit(1);

      let tier;
      if (existingTier[0]) {
        tier = await db
          .update(loyaltyTiers)
          .set({
            minPoints: Number(minPointsRequired),
            maxPoints: maxPoints === undefined ? null : Number(maxPoints),
            discountPercent: Number(discountPercentage),
            pointsMultiplier: Number(pointsMultiplier || 1),
          })
          .where(eq(loyaltyTiers.id, existingTier[0].id))
          .returning();
      } else {
        tier = await db
          .insert(loyaltyTiers)
          .values({
            name: String(name),
            minPoints: Number(minPointsRequired),
            maxPoints: maxPoints === undefined ? null : Number(maxPoints),
            discountPercent: Number(discountPercentage),
            pointsMultiplier: Number(pointsMultiplier || 1),
            freeShipping: null,
          })
          .returning();
      }

      res.json(tier[0]);
    } catch (error) {
      logger.error("Failed to create/update tier", { error });
      res.status(500).json({ error: "Failed to manage tier" });
    }
  },
);

export default router;
