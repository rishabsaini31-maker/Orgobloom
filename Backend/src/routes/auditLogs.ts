import { Router, Response, NextFunction } from "express";
import { db } from "@/db";
import { auditLogs } from "@/db/schema/auditLogs";
import { desc, eq, gte, lte, and, sql } from "drizzle-orm";
import { authenticate, isAdmin, AuthRequest } from "@/middleware/auth";
import { ApiError } from "@/middleware/errorHandler";

const router = Router();

// All audit log routes require admin authentication
router.use(authenticate);
router.use(isAdmin);

// Get audit logs with filters
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      action,
      entityType,
      userId,
      startDate,
      endDate,
      page = "1",
      limit = "50",
    } = req.query;

    const pageNum = parseInt(String(page));
    const limitNum = parseInt(String(limit));
    const offset = (pageNum - 1) * limitNum;

    // Build filter conditions
    const conditions: any[] = [];

    if (action) {
      conditions.push(eq(auditLogs.action, String(action)));
    }

    if (entityType) {
      conditions.push(eq(auditLogs.entityType, String(entityType)));
    }

    if (userId) {
      conditions.push(eq(auditLogs.userId, String(userId)));
    }

    if (startDate) {
      conditions.push(gte(auditLogs.createdAt, new Date(String(startDate))));
    }

    if (endDate) {
      conditions.push(lte(auditLogs.createdAt, new Date(String(endDate))));
    }

    // Execute query
    const results = await db
      .select()
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limitNum)
      .offset(offset);

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(auditLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count || 0);

    res.json({
      success: true,
      results,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get audit log by ID
router.get(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const [log] = await db
        .select()
        .from(auditLogs)
        .where(eq(auditLogs.id, id))
        .limit(1);

      if (!log) {
        throw new ApiError("Audit log not found", 404);
      }

      res.json({
        success: true,
        log,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get audit logs for a specific entity
router.get(
  "/entity/:entityType/:entityId",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { entityType, entityId } = req.params;

      const results = await db
        .select()
        .from(auditLogs)
        .where(
          and(
            eq(auditLogs.entityType, entityType),
            eq(auditLogs.entityId, entityId),
          ),
        )
        .orderBy(desc(auditLogs.createdAt))
        .limit(100);

      res.json({
        success: true,
        results,
      });
    } catch (error) {
      next(error);
    }
  },
);

// Get audit log statistics
router.get(
  "/stats/summary",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { startDate, endDate } = req.query;

      // Build date filter
      const dateConditions: any[] = [];
      if (startDate) {
        dateConditions.push(
          gte(auditLogs.createdAt, new Date(String(startDate))),
        );
      }
      if (endDate) {
        dateConditions.push(
          lte(auditLogs.createdAt, new Date(String(endDate))),
        );
      }

      // Get action counts
      const actionStats = await db
        .select({
          action: auditLogs.action,
          count: sql<number>`count(*)`,
        })
        .from(auditLogs)
        .where(dateConditions.length > 0 ? and(...dateConditions) : undefined)
        .groupBy(auditLogs.action);

      // Get entity type counts
      const entityStats = await db
        .select({
          entityType: auditLogs.entityType,
          count: sql<number>`count(*)`,
        })
        .from(auditLogs)
        .where(dateConditions.length > 0 ? and(...dateConditions) : undefined)
        .groupBy(auditLogs.entityType);

      // Get top users
      const topUsers = await db
        .select({
          userEmail: auditLogs.userEmail,
          count: sql<number>`count(*)`,
        })
        .from(auditLogs)
        .where(dateConditions.length > 0 ? and(...dateConditions) : undefined)
        .groupBy(auditLogs.userEmail)
        .orderBy(sql`count(*) desc`)
        .limit(10);

      res.json({
        success: true,
        stats: {
          byAction: actionStats,
          byEntityType: entityStats,
          topUsers,
        },
      });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
