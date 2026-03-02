import express, { Router, Request, Response } from "express";
import { sendEmail } from "../utils/emailService.js";
import { emailTemplates } from "../templates/emailTemplates.js";

const router = Router();

function logEmailEvent(
  level: "info" | "error",
  event: string,
  data: Record<string, unknown>,
) {
  const entry = {
    level,
    event,
    at: new Date().toISOString(),
    ...data,
  };

  if (level === "error") {
    console.error(JSON.stringify(entry));
    return;
  }

  console.log(JSON.stringify(entry));
}

// Type for email requests
interface EmailRequest {
  to: string | string[];
  templateType: string;
  data?: any;
}

/**
 * POST /api/email/send
 * Send an email using predefined templates
 */
router.post("/send", async (req: Request, res: Response) => {
  try {
    const requestId = (res.locals.requestId as string) || "unknown";
    const { to, templateType, data } = req.body as EmailRequest;

    logEmailEvent("info", "email.send.request_received", {
      requestId,
      templateType,
      recipientCount: Array.isArray(to) ? to.length : to ? 1 : 0,
    });

    if (!to || !templateType) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: to, templateType",
      });
    }

    let emailContent: { subject: string; html: string; text?: string } | null =
      null;

    // Select template based on templateType
    switch (templateType) {
      case "welcome":
        emailContent = emailTemplates.welcomeEmail(data?.userName || "User");
        break;

      case "password-reset":
        if (!data?.resetLink) {
          return res.status(400).json({
            success: false,
            message: "resetLink is required for password-reset template",
          });
        }
        emailContent = emailTemplates.passwordResetEmail(
          data?.userName || "User",
          data.resetLink,
        );
        break;

      case "order-confirmation":
        if (!data?.orderId || !data?.items || !data?.total) {
          return res.status(400).json({
            success: false,
            message:
              "orderId, items, and total are required for order-confirmation template",
          });
        }
        emailContent = emailTemplates.orderConfirmationEmail(
          data?.userName || "User",
          data.orderId,
          data.items,
          data.total,
          data?.estimatedDelivery || "Soon",
        );
        break;

      case "shipping-notification":
        if (!data?.orderId || !data?.trackingNumber || !data?.carrier) {
          return res.status(400).json({
            success: false,
            message:
              "orderId, trackingNumber, and carrier are required for shipping-notification template",
          });
        }
        emailContent = emailTemplates.shippingNotificationEmail(
          data?.userName || "User",
          data.orderId,
          data.trackingNumber,
          data.carrier,
        );
        break;

      case "contact-reply":
        if (!data?.visitorName || !data?.message) {
          return res.status(400).json({
            success: false,
            message:
              "visitorName and message are required for contact-reply template",
          });
        }
        emailContent = emailTemplates.contactFormReplyEmail(
          data.visitorName,
          data.message,
        );
        break;

      case "admin-notification":
        if (!data?.adminName || !data?.content) {
          return res.status(400).json({
            success: false,
            message:
              "adminName and content are required for admin-notification template",
          });
        }
        emailContent = emailTemplates.adminNotificationEmail(
          data.adminName,
          data?.subject || "System Notification",
          data.content,
        );
        break;

      default:
        return res.status(400).json({
          success: false,
          message: `Unknown template type: ${templateType}`,
          availableTemplates: [
            "welcome",
            "password-reset",
            "order-confirmation",
            "shipping-notification",
            "contact-reply",
            "admin-notification",
          ],
        });
    }

    if (!emailContent) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate email content",
      });
    }

    // Send email
    const success = await sendEmail({
      to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    if (success) {
      logEmailEvent("info", "email.send.success", {
        requestId,
        templateType,
      });
      return res.status(200).json({
        success: true,
        message: "Email sent successfully",
        recipient: to,
        template: templateType,
      });
    } else {
      logEmailEvent("error", "email.send.failed", {
        requestId,
        templateType,
        reason: "sendEmail returned false",
      });
      return res.status(500).json({
        success: false,
        message: "Failed to send email",
      });
    }
  } catch (error) {
    logEmailEvent("error", "email.send.exception", {
      requestId: (res.locals.requestId as string) || "unknown",
      message: error instanceof Error ? error.message : "unknown_error",
    });
    console.error("Email route error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * POST /api/email/test
 * Test email sending with Ethereal service
 */
router.post("/test", async (req: Request, res: Response) => {
  try {
    const requestId = (res.locals.requestId as string) || "unknown";
    const { to, subject, message } = req.body;

    logEmailEvent("info", "email.test.request_received", {
      requestId,
      recipient: to,
    });

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Email address is required",
      });
    }

    const success = await sendEmail({
      to,
      subject: subject || "Orgobloom Email Test",
      html: `<p>${message || "This is a test email from Orgobloom API"}</p>`,
    });

    if (success) {
      logEmailEvent("info", "email.test.success", {
        requestId,
        recipient: to,
      });
      return res.status(200).json({
        success: true,
        message: "Test email sent successfully",
        recipient: to,
      });
    } else {
      throw new Error("Failed to send test email");
    }
  } catch (error) {
    logEmailEvent("error", "email.test.failed", {
      requestId: (res.locals.requestId as string) || "unknown",
      message: error instanceof Error ? error.message : "unknown_error",
    });
    return res.status(500).json({
      success: false,
      message: "Failed to send test email",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * GET /api/email/templates
 * Get list of available email templates
 */
router.get("/templates", (req: Request, res: Response) => {
  const templates = [
    {
      id: "welcome",
      name: "Welcome Email",
      description: "Sent when a new user signs up",
      requiredData: ["userName"],
    },
    {
      id: "password-reset",
      name: "Password Reset",
      description: "Sent when user requests password reset",
      requiredData: ["userName", "resetLink"],
    },
    {
      id: "order-confirmation",
      name: "Order Confirmation",
      description: "Sent after successful order placement",
      requiredData: [
        "userName",
        "orderId",
        "items",
        "total",
        "estimatedDelivery",
      ],
    },
    {
      id: "shipping-notification",
      name: "Shipping Notification",
      description: "Sent when order is shipped",
      requiredData: ["userName", "orderId", "trackingNumber", "carrier"],
    },
    {
      id: "contact-reply",
      name: "Contact Form Reply",
      description: "Sent as acknowledgment for contact form submission",
      requiredData: ["visitorName", "message"],
    },
    {
      id: "admin-notification",
      name: "Admin Notification",
      description: "Sent to admin for system events",
      requiredData: ["adminName", "content", "subject"],
    },
  ];

  return res.status(200).json({
    success: true,
    templates,
    totalTemplates: templates.length,
  });
});

export default router;
