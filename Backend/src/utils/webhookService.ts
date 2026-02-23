import crypto from "crypto";
import axios, { AxiosError } from "axios";
import { db } from "../db";
import {
  webhooks,
  webhookDeliveries,
  WebhookEventType,
} from "../db/schema/webhooks";
import { eq, and, inArray } from "drizzle-orm";

// Webhook payload interface
interface WebhookPayload {
  event: WebhookEventType;
  timestamp: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

// Webhook delivery result
interface DeliveryResult {
  success: boolean;
  statusCode?: number;
  responseBody?: string;
  error?: string;
  duration: number;
}

/**
 * Generate signature for webhook payload
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

/**
 * Verify webhook signature (for incoming webhooks)
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

/**
 * Get all active webhooks for a specific event
 */
export async function getWebhooksForEvent(event: WebhookEventType) {
  const allWebhooks = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.status, "active"));

  // Filter webhooks that subscribe to this event
  return allWebhooks.filter((webhook) => {
    const events = webhook.events as string[];
    return events.includes(event) || events.includes("*");
  });
}

/**
 * Deliver webhook to endpoint
 */
async function deliverWebhook(
  webhook: typeof webhooks.$inferSelect,
  payload: WebhookPayload,
): Promise<DeliveryResult> {
  const startTime = Date.now();
  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payloadString, webhook.secret);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Webhook-Signature": signature,
    "X-Webhook-Event": payload.event,
    "X-Webhook-Timestamp": payload.timestamp,
    "X-Webhook-ID": webhook.id,
    ...(webhook.headers as Record<string, string>),
  };

  try {
    const response = await axios.post(webhook.url, payload, {
      headers,
      timeout: parseInt(webhook.timeout || "30000"),
      validateStatus: () => true, // Accept any status code
    });

    const duration = Date.now() - startTime;

    return {
      success: response.status >= 200 && response.status < 300,
      statusCode: response.status,
      responseBody: JSON.stringify(response.data),
      duration,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const axiosError = error as AxiosError;

    return {
      success: false,
      statusCode: axiosError.response?.status,
      responseBody: axiosError.response?.data
        ? JSON.stringify(axiosError.response.data)
        : undefined,
      error: axiosError.message,
      duration,
    };
  }
}

/**
 * Log webhook delivery attempt
 */
async function logDelivery(
  webhookId: string,
  event: WebhookEventType,
  payload: WebhookPayload,
  result: DeliveryResult,
  attemptNumber: number,
) {
  await db.insert(webhookDeliveries).values({
    webhookId,
    event,
    status: result.success ? "success" : "failed",
    payload: payload as any,
    responseStatusCode: result.statusCode?.toString(),
    responseBody: result.responseBody,
    errorMessage: result.error,
    attemptNumber: attemptNumber.toString(),
    duration: result.duration.toString(),
    deliveredAt: result.success ? new Date() : undefined,
  });
}

/**
 * Update webhook stats after delivery
 */
async function updateWebhookStats(webhookId: string, success: boolean) {
  const [webhook] = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.id, webhookId));

  if (!webhook) return;

  const failureCount = success
    ? "0"
    : (parseInt(webhook.failureCount || "0") + 1).toString();

  // Disable webhook after 5 consecutive failures
  const newStatus = parseInt(failureCount) >= 5 ? "inactive" : webhook.status;

  await db
    .update(webhooks)
    .set({
      lastDeliveryAt: new Date(),
      lastDeliveryStatus: success ? "success" : "failed",
      failureCount,
      status: newStatus,
      updatedAt: new Date(),
    })
    .where(eq(webhooks.id, webhookId));
}

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(
  event: WebhookEventType,
  data: Record<string, any>,
  metadata?: Record<string, any>,
) {
  try {
    const webhooksToTrigger = await getWebhooksForEvent(event);

    if (webhooksToTrigger.length === 0) {
      return { triggered: 0, results: [] };
    }

    const payload: WebhookPayload = {
      event,
      timestamp: new Date().toISOString(),
      data,
      metadata: {
        ...metadata,
        source: "orgobloom",
        version: "1.0",
      },
    };

    const results: Array<{
      webhookId: string;
      webhookName: string;
      success: boolean;
      statusCode?: number;
      attempts: number;
    }> = [];

    for (const webhook of webhooksToTrigger) {
      const maxRetries = parseInt(webhook.retryCount || "3");
      let attemptNumber = 1;
      let result: DeliveryResult | null = null;

      // Retry loop
      while (attemptNumber <= maxRetries) {
        result = await deliverWebhook(webhook, payload);

        if (result.success) break;

        // Wait before retry (exponential backoff)
        if (attemptNumber < maxRetries) {
          const delay =
            parseInt(webhook.retryDelay || "1000") *
            Math.pow(2, attemptNumber - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }

        attemptNumber++;
      }

      // Log delivery attempt
      await logDelivery(webhook.id, event, payload, result!, attemptNumber);

      // Update webhook stats
      await updateWebhookStats(webhook.id, result!.success);

      results.push({
        webhookId: webhook.id,
        webhookName: webhook.name,
        success: result!.success,
        statusCode: result!.statusCode,
        attempts: attemptNumber,
      });
    }

    return {
      triggered: webhooksToTrigger.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  } catch (error) {
    console.error("Webhook trigger error:", error);
    throw error;
  }
}

/**
 * Retry failed webhook delivery
 */
export async function retryWebhookDelivery(deliveryId: string) {
  const [delivery] = await db
    .select()
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.id, deliveryId));

  if (!delivery) {
    throw new Error("Delivery not found");
  }

  const [webhook] = await db
    .select()
    .from(webhooks)
    .where(eq(webhooks.id, delivery.webhookId));

  if (!webhook) {
    throw new Error("Webhook not found");
  }

  const payload = delivery.payload as WebhookPayload;
  const result = await deliverWebhook(webhook, payload);

  // Log new delivery attempt
  await logDelivery(
    webhook.id,
    delivery.event as WebhookEventType,
    payload,
    result,
    parseInt(delivery.attemptNumber || "1") + 1,
  );

  // Update webhook stats
  await updateWebhookStats(webhook.id, result.success);

  return result;
}

/**
 * Generate a new webhook secret
 */
export function generateWebhookSecret(): string {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Verify Razorpay webhook signature
 */
export function verifyRazorpaySignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature),
  );
}

/**
 * Verify Shiprocket webhook signature
 */
export function verifyShiprocketSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  return verifySignature(payload, signature, secret);
}

export default {
  triggerWebhooks,
  generateSignature,
  verifySignature,
  verifyRazorpaySignature,
  verifyShiprocketSignature,
  generateWebhookSecret,
  retryWebhookDelivery,
  getWebhooksForEvent,
};
