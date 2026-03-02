// @ts-nocheck
import { Router, Response } from "express";
import { db } from "../db/index.js";
import { supportTickets, ticketReplies } from "../db/schema/supportTicket.js";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { logger } from "../utils/logger.js";
import { eq, sql } from "drizzle-orm";
import { sendSMS, smsTemplates } from "../services/sms/smsService.js";

const router = Router();

/**
 * @route   POST /api/tickets/create
 * @desc    Create a new support ticket
 * @access  Authenticated users
 */
router.post(
  "/create",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const {
        subject,
        description,
        category,
        priority = "MEDIUM",
        orderId,
      } = req.body;

      if (!subject || !description) {
        return res
          .status(400)
          .json({ error: "Subject and description required" });
      }

      const ticket = await db
        .insert(supportTickets)
        .values({
          userId: req.user?.id || "",
          subject,
          description,
          category: category || "GENERAL",
          priority,
          orderId,
        })
        .returning();

      logger.info("Support ticket created", {
        ticketId: ticket[0].id,
        userId: req.user?.id,
      });

      res.status(201).json(ticket[0]);
    } catch (error) {
      logger.error("Failed to create support ticket", { error });
      res.status(500).json({ error: "Failed to create ticket" });
    }
  },
);

/**
 * @route   GET /api/tickets/my-tickets
 * @desc    Get user's support tickets
 * @access  Authenticated users
 */
router.get(
  "/my-tickets",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { status, page = 1, limit = 10 } = req.query;

      let query = db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.userId, req.user?.id || ""));

      if (status) {
        query = query.where(eq(supportTickets.status, status as string));
      }

      const tickets = await query
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit));

      const totalCount = await db
        .select({ count: sql`count(*)` })
        .from(supportTickets)
        .where(eq(supportTickets.userId, req.user?.id || ""));

      res.json({
        tickets,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(totalCount[0]?.count || 0),
        },
      });
    } catch (error) {
      logger.error("Failed to fetch user tickets", { error });
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  },
);

/**
 * @route   GET /api/tickets/:ticketId
 * @desc    Get ticket details with replies
 * @access  Authenticated users (own ticket or admin)
 */
router.get(
  "/:ticketId",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { ticketId } = req.params;

      const ticket = await db.query.supportTickets.findFirst({
        where: (tickets) => eq(tickets.id, ticketId),
        with: {
          user: true,
        },
      });

      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Check authorization
      if (ticket.userId !== req.user?.id && req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const replies = await db
        .select()
        .from(ticketReplies)
        .where(eq(ticketReplies.ticketId, ticketId))
        .orderBy(ticketReplies.createdAt);

      res.json({ ticket, replies });
    } catch (error) {
      logger.error("Failed to fetch ticket", { error });
      res.status(500).json({ error: "Failed to fetch ticket" });
    }
  },
);

/**
 * @route   POST /api/tickets/:ticketId/reply
 * @desc    Add reply to support ticket
 * @access  Authenticated users
 */
router.post(
  "/:ticketId/reply",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { ticketId } = req.params;
      const { message, attachmentUrls = [] } = req.body;

      if (!message) {
        return res.status(400).json({ error: "Message required" });
      }

      const ticket = await db.query.supportTickets.findFirst({
        where: (tickets) => eq(tickets.id, ticketId),
      });

      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      // Check authorization
      if (ticket.userId !== req.user?.id && req.user?.role !== "ADMIN") {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const isAdminReply = req.user?.role === "ADMIN";

      const reply = await db
        .insert(ticketReplies)
        .values({
          ticketId,
          userId: req.user?.id || "",
          message,
          isAdminReply,
          attachmentUrls:
            attachmentUrls.length > 0 ? JSON.stringify(attachmentUrls) : null,
        })
        .returning();

      // Update ticket status
      await db
        .update(supportTickets)
        .set({
          status: isAdminReply ? "IN_PROGRESS" : "WAITING_ADMIN",
          updatedAt: new Date(),
        })
        .where(eq(supportTickets.id, ticketId));

      logger.info("Ticket reply added", { ticketId, isAdminReply });

      res.status(201).json(reply[0]);
    } catch (error) {
      logger.error("Failed to add ticket reply", { error });
      res.status(500).json({ error: "Failed to add reply" });
    }
  },
);

/**
 * @route   PATCH /api/tickets/:ticketId/status
 * @desc    Update ticket status
 * @access  Admin only
 */
router.patch(
  "/:ticketId/status",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { ticketId } = req.params;
      const { status, resolution } = req.body;

      if (!status) {
        return res.status(400).json({ error: "Status required" });
      }

      const updates: Record<string, any> = {
        status,
        updatedAt: new Date(),
      };

      if (resolution) {
        updates.resolution = resolution;
        updates.resolutionTime = new Date();
      }

      if (status === "CLOSED" || status === "RESOLVED") {
        updates.closedAt = new Date();
      }

      const ticket = await db
        .update(supportTickets)
        .set(updates)
        .where(eq(supportTickets.id, ticketId))
        .returning();

      logger.info("Ticket status updated", { ticketId, status });

      res.json(ticket[0]);
    } catch (error) {
      logger.error("Failed to update ticket status", { error });
      res.status(500).json({ error: "Failed to update ticket" });
    }
  },
);

/**
 * @route   PATCH /api/tickets/:ticketId/assign
 * @desc    Assign ticket to admin
 * @access  Admin only
 */
router.patch(
  "/:ticketId/assign",
  authenticateToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const { ticketId } = req.params;
      const { adminId } = req.body;

      const ticket = await db
        .update(supportTickets)
        .set({
          assignedToAdmin: adminId,
          updatedAt: new Date(),
        })
        .where(eq(supportTickets.id, ticketId))
        .returning();

      logger.info("Ticket assigned", { ticketId, adminId });

      res.json(ticket[0]);
    } catch (error) {
      logger.error("Failed to assign ticket", { error });
      res.status(500).json({ error: "Failed to assign ticket" });
    }
  },
);

/**
 * @route   POST /api/tickets/:ticketId/satisfaction
 * @desc    Submit satisfaction survey
 * @access  Authenticated users
 */
router.post(
  "/:ticketId/satisfaction",
  authenticateToken,
  async (req: Request, res: Response) => {
    try {
      const { ticketId } = req.params;
      const { rating, notes = "" } = req.body;

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ error: "Rating must be between 1-5" });
      }

      const ticket = await db.query.supportTickets.findFirst({
        where: (tickets) => eq(tickets.id, ticketId),
      });

      if (!ticket) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      if (ticket.userId !== req.user?.id) {
        return res.status(403).json({ error: "Unauthorized" });
      }

      const updated = await db
        .update(supportTickets)
        .set({
          satisfactionRating: rating,
          satisfactionNotes: notes,
          updatedAt: new Date(),
        })
        .where(eq(supportTickets.id, ticketId))
        .returning();

      logger.info("Satisfaction rating submitted", { ticketId, rating });

      res.json(updated[0]);
    } catch (error) {
      logger.error("Failed to submit satisfaction", { error });
      res.status(500).json({ error: "Failed to submit rating" });
    }
  },
);

/**
 * @route   GET /api/tickets (Admin)
 * @desc    Get all support tickets (paginated)
 * @access  Admin only
 */
router.get(
  "/",
  authenticateToken,
  adminOnly,
  async (req: Request, res: Response) => {
    try {
      const {
        status,
        category,
        priority,
        page = 1,
        limit = 20,
        search,
      } = req.query;

      let query = db.select().from(supportTickets);

      if (status) {
        query = query.where(eq(supportTickets.status, status as string));
      }

      if (category) {
        query = query.where(eq(supportTickets.category, category as string));
      }

      if (priority) {
        query = query.where(eq(supportTickets.priority, priority as string));
      }

      const tickets = await query
        .limit(Number(limit))
        .offset((Number(page) - 1) * Number(limit))
        .orderBy(supportTickets.createdAt);

      const totalCount = await db
        .select({ count: sql`count(*)` })
        .from(supportTickets);

      res.json({
        tickets,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: Number(totalCount[0]?.count || 0),
        },
      });
    } catch (error) {
      logger.error("Failed to fetch all tickets", { error });
      res.status(500).json({ error: "Failed to fetch tickets" });
    }
  },
);

export default router;
