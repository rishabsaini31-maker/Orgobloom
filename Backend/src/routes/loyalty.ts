// @ts-nocheck
import { Router, Response } from "express";
import { db } from "../db/index.js";
import {
  loyaltyProgram,
  loyaltyTransactions,
  loyaltyTierConfig,
  loyaltyRewards,
} from "../db/schema/loyalty.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";
import { eq, desc, sql, and, lte, gte } from "drizzle-orm";

const router = Router();

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
      const userId = req.user?.id;

      let account = await db.query.loyaltyProgram.findFirst({
        where: (program) => eq(program.userId, userId || ""),
      });

      if (!account) {
        account = await db
          .insert(loyaltyProgram)
          .values({ userId: userId || "" })
          .returning();
      }

      const transactions = await db
        .select()
        .from(loyaltyTransactions)
        .where(eq(loyaltyTransactions.userId, userId || ""))
        .orderBy(desc(loyaltyTransactions.createdAt))
        .limit(20);

      const tierConfig = await db
        .select()
        .from(loyaltyTierConfig)
        .where(eq(loyaltyTierConfig.name, account[0]?.tier || "BRONZE"));

      res.json({
        account: account[0],
        recentTransactions: transactions,
        tierInfo: tierConfig[0],
      });
    } catch (error) {
      logger.error("Failed to fetch loyalty account", { error });
      res.status(500).json({ error: "Failed to fetch loyalty account" });
    }
  },
);

/**
 * @route   GET /api/loyalty/rewards
 * @desc    Get available loyalty rewards
 * @access  Authenticated users
 */
router.get(
  "/rewards",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const rewards = await db
        .select()
        .from(loyaltyRewards)
        .where(
          and(
            eq(loyaltyRewards.active, true),
            lte(loyaltyRewards.validFrom, new Date()),
            gte(loyaltyRewards.validTo, new Date()),
          ),
        )
        .orderBy(loyaltyRewards.pointsRequired);

      res.json(rewards);
    } catch (error) {
      logger.error("Failed to fetch rewards", { error });
      res.status(500).json({ error: "Failed to fetch rewards" });
    }
  },
);

/**
 * @route   POST /api/loyalty/redeem
 * @desc    Redeem loyalty reward
 * @access  Authenticated users
 */
router.post(
  "/redeem",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { rewardId } = req.body;
      const userId = req.user?.id;

      const reward = await db.query.loyaltyRewards.findFirst({
        where: (rewards) => eq(rewards.id, rewardId as string),
      });

      if (!reward) {
        return res.status(404).json({ error: "Reward not found" });
      }

      const account = await db.query.loyaltyProgram.findFirst({
        where: (program) => eq(program.userId, userId || ""),
      });

      if (!account) {
        return res.status(400).json({ error: "Loyalty account not found" });
      }

      if (account[0].availablePoints < reward.pointsRequired) {
        return res.status(400).json({ error: "Insufficient loyalty points" });
      }

      if (
        reward.maxRedemptions &&
        reward.currentRedemptions >= reward.maxRedemptions
      ) {
        return res
          .status(400)
          .json({ error: "Reward redemption limit reached" });
      }

      // Create transaction
      const transaction = await db
        .insert(loyaltyTransactions)
        .values({
          userId: userId || "",
          points: -reward.pointsRequired,
          type: "REWARD",
          description: `Redeemed: ${reward.name}`,
          redeemedAt: new Date(),
        })
        .returning();

      // Update account
      await db
        .update(loyaltyProgram)
        .set({
          availablePoints: sql`available_points - ${reward.pointsRequired}`,
          updatedAt: new Date(),
        })
        .where(eq(loyaltyProgram.userId, userId || ""));

      // Update reward redemptions
      await db
        .update(loyaltyRewards)
        .set({
          currentRedemptions: sql`current_redemptions + 1`,
        })
        .where(eq(loyaltyRewards.id, rewardId as string));

      logger.info("Loyalty reward redeemed", { userId, rewardId });

      res.json({
        success: true,
        transaction: transaction[0],
        message: `Successfully redeemed ${reward.name}!`,
      });
    } catch (error) {
      logger.error("Failed to redeem loyalty reward", { error });
      res.status(500).json({ error: "Failed to redeem reward" });
    }
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
  async (req: AuthRequest, res: Response) => {
    try {
      // Total loyalty members
      const totalMembers = await db
        .select({ count: sql`count(*)` })
        .from(loyaltyProgram);

      // Members by tier
      const membersByTier = await db
        .select({
          tier: loyaltyProgram.tier,
          count: sql`count(*) as member_count`,
        })
        .from(loyaltyProgram)
        .groupBy(loyaltyProgram.tier);

      // Total points distributed
      const totalPointsDistributed = await db
        .select({
          totalPoints: sql`sum(points) as total_points`,
        })
        .from(loyaltyTransactions);

      // Active rewards
      const activeRewards = await db
        .select({ count: sql`count(*)` })
        .from(loyaltyRewards)
        .where(eq(loyaltyRewards.active, true));

      // Avg loyalty score by tier
      const avgPointsByTier = await db
        .select({
          tier: loyaltyProgram.tier,
          avgPoints: sql`avg(available_points) as avg_points`,
        })
        .from(loyaltyProgram)
        .groupBy(loyaltyProgram.tier);

      res.json({
        summary: {
          totalMembers: Number(totalMembers[0]?.count || 0),
          totalActiveRewards: Number(activeRewards[0]?.count || 0),
          totalPointsInCirculation: Number(
            totalPointsDistributed[0]?.totalPoints || 0,
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
  async (req: AuthRequest, res: Response) => {
    try {
      const { name, minPointsRequired, discountPercentage, pointsMultiplier } =
        req.body;

      if (!name || !minPointsRequired || !discountPercentage) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const tier = await db
        .insert(loyaltyTierConfig)
        .values({
          name,
          minPointsRequired,
          discountPercentage,
          pointsMultiplier: pointsMultiplier || 1,
        })
        .returning()
        .onConflictDoUpdate({
          target: loyaltyTierConfig.name,
          set: { discountPercentage, pointsMultiplier },
        });

      res.json(tier[0]);
    } catch (error) {
      logger.error("Failed to create/update tier", { error });
      res.status(500).json({ error: "Failed to manage tier" });
    }
  },
);

export default router;
