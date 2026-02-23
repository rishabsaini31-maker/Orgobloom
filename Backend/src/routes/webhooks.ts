import express, { Request, Response, NextFunction } from "express";
import { db } from "../db";
import {
  webhooks,
  webhookDeliveries,
  integrations,
} from "../db/schema/webhooks";
import { eq, desc, and } from "drizzle-orm";
import { authenticate } from "../middleware/auth";
import { ApiError } from "../middleware/errorHandler";
import {
  generateWebhookSecret,
  triggerWebhooks,
  retryWebhookDelivery,
  verifyRazorpaySignature,
  verifySignature,
} from "../utils/webhookService";

const router = express.Router();

// Extend Request type for authenticated routes
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: string;
    email: string;
  };
  params: Record<string, string>;
  query: Record<string, any>;
  body: any;
}

// =====================
// Admin Webhook Management
// =====================

/**
 * @route GET /api/webhooks
 * @desc Get all webhooks (admin only)
 */
router.get(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const allWebhooks = await db
        .select()
        .from(webhooks)
        .orderBy(desc(webhooks.createdAt));

      // Mask secrets for security
      const maskedWebhooks = allWebhooks.map((webhook) => ({
        ...webhook,
        secret: webhook.secret ? "••••••••" : null,
      }));

      res.json({ webhooks: maskedWebhooks });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route GET /api/webhooks/:id
 * @desc Get webhook by ID (admin only)
 */
router.get(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { id } = req.params;

      const [webhook] = await db
        .select()
        .from(webhooks)
        .where(eq(webhooks.id, id));

      if (!webhook) {
        throw new ApiError("Webhook not found", 404);
      }

      res.json({ webhook });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route POST /api/webhooks
 * @desc Create a new webhook (admin only)
 */
router.post(
  "/",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const {
        name,
        url,
        events,
        description,
        headers,
        retryCount,
        retryDelay,
        timeout,
      } = req.body;

      if (!name || !url || !events || !Array.isArray(events)) {
        throw new ApiError("Name, URL, and events are required", 400);
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        throw new ApiError("Invalid URL format", 400);
      }

      const secret = generateWebhookSecret();

      const [webhook] = await db
        .insert(webhooks)
        .values({
          name,
          url,
          secret,
          events: events as any,
          description,
          headers: headers as any,
          retryCount: retryCount?.toString(),
          retryDelay: retryDelay?.toString(),
          timeout: timeout?.toString(),
          createdBy: req.user.id,
        })
        .returning();

      res.status(201).json({
        success: true,
        webhook,
        secret, // Only shown once during creation
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route PUT /api/webhooks/:id
 * @desc Update a webhook (admin only)
 */
router.put(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { id } = req.params;
      const {
        name,
        url,
        events,
        status,
        description,
        headers,
        retryCount,
        retryDelay,
        timeout,
      } = req.body;

      const [existingWebhook] = await db
        .select()
        .from(webhooks)
        .where(eq(webhooks.id, id));

      if (!existingWebhook) {
        throw new ApiError("Webhook not found", 404);
      }

      const [updatedWebhook] = await db
        .update(webhooks)
        .set({
          name: name || existingWebhook.name,
          url: url || existingWebhook.url,
          events: events ? (events as any) : existingWebhook.events,
          status: status || existingWebhook.status,
          description:
            description !== undefined
              ? description
              : existingWebhook.description,
          headers:
            headers !== undefined ? (headers as any) : existingWebhook.headers,
          retryCount: retryCount?.toString() || existingWebhook.retryCount,
          retryDelay: retryDelay?.toString() || existingWebhook.retryDelay,
          timeout: timeout?.toString() || existingWebhook.timeout,
          updatedAt: new Date(),
        })
        .where(eq(webhooks.id, id))
        .returning();

      res.json({ success: true, webhook: updatedWebhook });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route DELETE /api/webhooks/:id
 * @desc Delete a webhook (admin only)
 */
router.delete(
  "/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { id } = req.params;

      const [webhook] = await db
        .select()
        .from(webhooks)
        .where(eq(webhooks.id, id));

      if (!webhook) {
        throw new ApiError("Webhook not found", 404);
      }

      await db.delete(webhooks).where(eq(webhooks.id, id));

      res.json({ success: true, message: "Webhook deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route POST /api/webhooks/:id/regenerate-secret
 * @desc Regenerate webhook secret (admin only)
 */
router.post(
  "/:id/regenerate-secret",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { id } = req.params;

      const [webhook] = await db
        .select()
        .from(webhooks)
        .where(eq(webhooks.id, id));

      if (!webhook) {
        throw new ApiError("Webhook not found", 404);
      }

      const newSecret = generateWebhookSecret();

      await db
        .update(webhooks)
        .set({ secret: newSecret, updatedAt: new Date() })
        .where(eq(webhooks.id, id));

      res.json({
        success: true,
        message: "Secret regenerated successfully",
        secret: newSecret,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route POST /api/webhooks/:id/test
 * @desc Test a webhook (admin only)
 */
router.post(
  "/:id/test",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { id } = req.params;

      const [webhook] = await db
        .select()
        .from(webhooks)
        .where(eq(webhooks.id, id));

      if (!webhook) {
        throw new ApiError("Webhook not found", 404);
      }

      // Trigger test webhook
      const result = await triggerWebhooks("order.created", {
        test: true,
        message: "This is a test webhook",
        webhookId: id,
      });

      res.json({
        success: true,
        message: "Test webhook sent",
        result,
      });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route GET /api/webhooks/:id/deliveries
 * @desc Get webhook delivery history (admin only)
 */
router.get(
  "/:id/deliveries",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { id } = req.params;
      const { page = "1", limit = "20" } = req.query;

      const deliveries = await db
        .select()
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.webhookId, id))
        .orderBy(desc(webhookDeliveries.createdAt))
        .limit(parseInt(limit as string))
        .offset((parseInt(page as string) - 1) * parseInt(limit as string));

      res.json({ deliveries });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route POST /api/webhooks/deliveries/:deliveryId/retry
 * @desc Retry a failed webhook delivery (admin only)
 */
router.post(
  "/deliveries/:deliveryId/retry",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { deliveryId } = req.params;

      const result = await retryWebhookDelivery(deliveryId);

      res.json({
        success: result.success,
        message: result.success
          ? "Webhook delivered successfully"
          : "Webhook delivery failed",
        result,
      });
    } catch (error) {
      next(error);
    }
  },
);

// =====================
// Third-party Webhook Receivers
// =====================

/**
 * @route POST /api/webhooks/receive/razorpay
 * @desc Receive Razorpay webhook
 */
router.post(
  "/receive/razorpay",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers["x-razorpay-signature"] as string;
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

      if (!secret) {
        console.error("Razorpay webhook secret not configured");
        res.status(500).json({ error: "Webhook not configured" });
        return;
      }

      const payload = JSON.stringify(req.body);

      // Verify signature
      if (!verifyRazorpaySignature(payload, signature, secret)) {
        console.error("Invalid Razorpay webhook signature");
        res.status(401).json({ error: "Invalid signature" });
        return;
      }

      const event = req.body;
      const eventType = event.event;

      console.log(`Received Razorpay webhook: ${eventType}`);

      // Handle different Razorpay events
      switch (eventType) {
        case "payment.captured":
          await triggerWebhooks("payment.captured", {
            paymentId: event.payload.payment.entity.id,
            orderId: event.payload.payment.entity.order_id,
            amount: event.payload.payment.entity.amount / 100, // Convert from paise
            currency: event.payload.payment.entity.currency,
            method: event.payload.payment.entity.method,
            status: event.payload.payment.entity.status,
            createdAt: event.payload.payment.entity.created_at,
          });
          break;

        case "payment.failed":
          await triggerWebhooks("payment.failed", {
            paymentId: event.payload.payment.entity.id,
            orderId: event.payload.payment.entity.order_id,
            errorCode: event.payload.payment.entity.error_code,
            errorDescription: event.payload.payment.entity.error_description,
          });
          break;

        case "refund.created":
          await triggerWebhooks("payment.refunded", {
            refundId: event.payload.refund.entity.id,
            paymentId: event.payload.refund.entity.payment_id,
            amount: event.payload.refund.entity.amount / 100,
            status: event.payload.refund.entity.status,
          });
          break;

        default:
          console.log(`Unhandled Razorpay event: ${eventType}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Razorpay webhook error:", error);
      next(error);
    }
  },
);

/**
 * @route POST /api/webhooks/receive/fship
 * @desc Receive Fship webhook
 */
router.post(
  "/receive/fship",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers["x-fship-signature"] as string;
      const secret = process.env.FSHIP_WEBHOOK_SECRET;

      if (secret && signature) {
        const payload = JSON.stringify(req.body);
        if (!verifySignature(payload, signature, secret)) {
          console.error("Invalid Fship webhook signature");
          res.status(401).json({ error: "Invalid signature" });
          return;
        }
      }

      const event = req.body;
      console.log(`Received Fship webhook:`, event);

      // Handle Fship shipment status updates
      // Fship typically sends: shipment_id, order_id, status, awb, current_location, timestamp
      if (event.shipment_id || event.order_id) {
        const statusMap: Record<string, string> = {
          PICKUP_REQUESTED: "pickup_requested",
          PICKUP_DONE: "picked_up",
          IN_TRANSIT: "in_transit",
          OUT_FOR_DELIVERY: "out_for_delivery",
          DELIVERED: "delivered",
          CANCELLED: "cancelled",
          RTO: "returned",
          PENDING: "pending",
        };

        const mappedStatus =
          statusMap[event.status] || event.status?.toLowerCase();

        await triggerWebhooks("shipment.updated", {
          shipmentId: event.shipment_id,
          orderId: event.order_id,
          status: mappedStatus,
          awb: event.awb || event.awb_code,
          courier: event.courier_name || event.courier,
          currentLocation: event.current_location || event.location,
          timestamp:
            event.timestamp || event.updated_at || new Date().toISOString(),
          message: event.message || event.remarks,
        });

        // Also trigger delivered event if status is delivered
        if (mappedStatus === "delivered") {
          await triggerWebhooks("shipment.delivered", {
            shipmentId: event.shipment_id,
            orderId: event.order_id,
            deliveredAt:
              event.timestamp || event.delivered_at || new Date().toISOString(),
          });
        }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Fship webhook error:", error);
      next(error);
    }
  },
);

// =====================
// Integration Management
// =====================

/**
 * @route GET /api/webhooks/integrations
 * @desc Get all integrations (admin only)
 */
router.get(
  "/integrations",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const allIntegrations = await db
        .select()
        .from(integrations)
        .orderBy(desc(integrations.createdAt));

      // Mask sensitive data
      const maskedIntegrations = allIntegrations.map((integration) => ({
        ...integration,
        apiKey: integration.apiKey ? "••••••••" : null,
        apiSecret: integration.apiSecret ? "••••••••" : null,
      }));

      res.json({ integrations: maskedIntegrations });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route POST /api/webhooks/integrations
 * @desc Create a new integration (admin only)
 */
router.post(
  "/integrations",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const {
        name,
        type,
        apiKey,
        apiSecret,
        apiEndpoint,
        config,
        webhookUrl,
        webhookSecret,
      } = req.body;

      if (!name || !type) {
        throw new ApiError("Name and type are required", 400);
      }

      const [integration] = await db
        .insert(integrations)
        .values({
          name,
          type,
          apiKey,
          apiSecret,
          apiEndpoint,
          config: config as any,
          webhookUrl,
          webhookSecret,
          createdBy: req.user.id,
        })
        .returning();

      res.status(201).json({ success: true, integration });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route PUT /api/webhooks/integrations/:id
 * @desc Update an integration (admin only)
 */
router.put(
  "/integrations/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { id } = req.params;
      const {
        name,
        type,
        apiKey,
        apiSecret,
        apiEndpoint,
        config,
        status,
        webhookUrl,
        webhookSecret,
      } = req.body;

      const [existingIntegration] = await db
        .select()
        .from(integrations)
        .where(eq(integrations.id, id));

      if (!existingIntegration) {
        throw new ApiError("Integration not found", 404);
      }

      const [updatedIntegration] = await db
        .update(integrations)
        .set({
          name: name || existingIntegration.name,
          type: type || existingIntegration.type,
          apiKey: apiKey !== undefined ? apiKey : existingIntegration.apiKey,
          apiSecret:
            apiSecret !== undefined ? apiSecret : existingIntegration.apiSecret,
          apiEndpoint: apiEndpoint || existingIntegration.apiEndpoint,
          config:
            config !== undefined ? (config as any) : existingIntegration.config,
          status: status || existingIntegration.status,
          webhookUrl:
            webhookUrl !== undefined
              ? webhookUrl
              : existingIntegration.webhookUrl,
          webhookSecret:
            webhookSecret !== undefined
              ? webhookSecret
              : existingIntegration.webhookSecret,
          updatedAt: new Date(),
        })
        .where(eq(integrations.id, id))
        .returning();

      res.json({ success: true, integration: updatedIntegration });
    } catch (error) {
      next(error);
    }
  },
);

/**
 * @route DELETE /api/webhooks/integrations/:id
 * @desc Delete an integration (admin only)
 */
router.delete(
  "/integrations/:id",
  authenticate,
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (req.user?.role !== "ADMIN") {
        throw new ApiError("Unauthorized", 403);
      }

      const { id } = req.params;

      const [integration] = await db
        .select()
        .from(integrations)
        .where(eq(integrations.id, id));

      if (!integration) {
        throw new ApiError("Integration not found", 404);
      }

      await db.delete(integrations).where(eq(integrations.id, id));

      res.json({ success: true, message: "Integration deleted successfully" });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
