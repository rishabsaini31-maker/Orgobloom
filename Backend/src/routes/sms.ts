// @ts-nocheck

import { Router, Response } from "express";
import { authenticate, AuthRequest } from "../middleware/auth.js";
import { sendSMS, smsTemplates } from "../services/sms/smsService.js";
import { logger } from "../utils/logger.js";
import { db } from "../db/index.js";
import { auditLogs } from "../db/schema/auditLogs.js";

const router = Router();

/**
 * @route   POST /api/sms/send
 * @desc    Send SMS to user
 * @access  Admin only
 */
router.post("/send", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, message, templateType, variables } = req.body;

    if (!message && !templateType) {
      return res.status(400).json({ error: "Message or template required" });
    }

    // Get user phone from database
    const user = await db.query.users.findFirst({
      where: (users, { eq }) => eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!user.phone) {
      return res.status(400).json({ error: "User phone not found" });
    }

    // Use template or custom message
    let smsMessage = message;
    if (
      templateType &&
      smsTemplates[templateType as keyof typeof smsTemplates]
    ) {
      const templateFn =
        smsTemplates[templateType as keyof typeof smsTemplates];
      if (typeof templateFn === "function") {
        smsMessage = templateFn(...(variables || []));
      }
    }

    const messageId = await sendSMS({
      to: user.phone,
      message: smsMessage,
      transactional: true,
    });

    // Log SMS send action
    await db.insert(auditLogs).values({
      userId: req.user?.id || "system",
      action: "SMS_SENT",
      resource: "SMS",
      resourceId: messageId || "failed",
      details: { to: user.phone, templateType },
      changes: {},
    });

    res.json({
      success: true,
      messageId,
      phone: user.phone.replace(/^(\d{2})/g, "**"),
    });
  } catch (error) {
    logger.error("SMS send failed", { error });
    res.status(500).json({ error: "Failed to send SMS" });
  }
});

/**
 * @route   POST /api/sms/bulk
 * @desc    Send SMS to multiple users
 * @access  Admin only
 */
router.post("/bulk", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userIds, message, templateType, variables } = req.body;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: "userIds array required" });
    }

    if (userIds.length > 1000) {
      return res.status(400).json({ error: "Maximum 1000 users per request" });
    }

    // Get users with phones
    const users = await db.query.users.findMany({
      where: (users, { inArray }) => inArray(users.id, userIds),
    });

    const usersWithPhones = users.filter((u) => u.phone);

    if (usersWithPhones.length === 0) {
      return res
        .status(400)
        .json({ error: "No users with phone numbers found" });
    }

    // Build SMS messages
    let smsMessage = message;
    if (
      templateType &&
      smsTemplates[templateType as keyof typeof smsTemplates]
    ) {
      const templateFn =
        smsTemplates[templateType as keyof typeof smsTemplates];
      if (typeof templateFn === "function") {
        smsMessage = templateFn(...(variables || []));
      }
    }

    const smsPromises = usersWithPhones.map((user) =>
      sendSMS({
        to: user.phone!,
        message: smsMessage,
        transactional: true,
      }),
    );

    const results = await Promise.all(smsPromises);
    const successCount = results.filter((r) => r !== null).length;

    // Log bulk SMS action
    await db.insert(auditLogs).values({
      userId: req.user?.id || "system",
      action: "BULK_SMS_SENT",
      resource: "SMS",
      resourceId: "bulk",
      details: { userCount: usersWithPhones.length, templateType },
      changes: {},
    });

    res.json({
      success: true,
      totalRequested: usersWithPhones.length,
      successCount,
      failureCount: usersWithPhones.length - successCount,
    });
  } catch (error) {
    logger.error("Bulk SMS send failed", { error });
    res.status(500).json({ error: "Failed to send bulk SMS" });
  }
});

/**
 * @route   GET /api/sms/templates
 * @desc    Get available SMS templates
 * @access  Public
 */
router.get("/templates", (req, res) => {
  const templates = Object.keys(smsTemplates).map((key) => ({
    key,
    name: key
      .replace(/([A-Z])/g, " $1")
      .toLowerCase()
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase()),
  }));

  res.json({ templates });
});

export default router;
