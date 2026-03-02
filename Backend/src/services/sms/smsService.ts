// @ts-nocheck
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import { logger } from "../../utils/logger.js";

const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export interface SmsOptions {
  to: string;
  message: string;
  transactional?: boolean;
  attributes?: Record<string, string>;
}

export async function sendSMS(options: SmsOptions): Promise<string | null> {
  try {
    if (!process.env.AWS_SNS_ENABLED) {
      logger.warn("SMS sending disabled. Configure AWS_SNS_ENABLED=true");
      return null;
    }

    const { to, message, transactional = true, attributes = {} } = options;

    // Validate phone number (must be 10 digits for India)
    const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
    const formattedPhone = to.replace(/[^0-9+]/g, "");

    if (!phoneRegex.test(formattedPhone)) {
      logger.error("Invalid phone number for SMS", { phone: formattedPhone });
      throw new Error("Invalid phone number format");
    }

    // Ensure phone starts with +91 for SNS
    const finalPhone = formattedPhone.startsWith("+91")
      ? formattedPhone
      : formattedPhone.startsWith("91")
        ? `+${formattedPhone}`
        : `+91${formattedPhone}`;

    const params = {
      Message: message,
      PhoneNumber: finalPhone,
      MessageAttributes: {
        "AWS.SNS.SMS.SmsType": {
          DataType: "String",
          StringValue: transactional ? "Transactional" : "Promotional",
        },
        ...Object.entries(attributes).reduce(
          (acc, [key, value]) => {
            acc[key] = {
              DataType: "String",
              StringValue: value,
            };
            return acc;
          },
          {} as Record<string, { DataType: string; StringValue: string }>,
        ),
      },
    };

    const command = new PublishCommand(params);
    const response = await snsClient.send(command);

    logger.info("SMS sent successfully", {
      messageId: response.MessageId,
      phone: finalPhone,
    });

    return response.MessageId || null;
  } catch (error) {
    logger.error("Failed to send SMS", {
      error: error instanceof Error ? error.message : String(error),
      phone: options.to,
    });
    return null;
  }
}

export async function sendSMSBatch(
  messages: SmsOptions[],
): Promise<(string | null)[]> {
  return Promise.all(messages.map((msg) => sendSMS(msg)));
}

export const smsTemplates = {
  orderConfirmation: (orderId: string, total: string) =>
    `Your Orgobloom order #${orderId} is confirmed. Total: ${total}. Track it on our website.`,

  paymentSuccess: (amount: string) =>
    `Payment of ${amount} received successfully. Your order will be processed soon.`,

  paymentFailed: (orderId: string) =>
    `Payment for order #${orderId} failed. Please try again or use another payment method.`,

  orderShipped: (orderId: string, trackingId: string) =>
    `Your order #${orderId} has shipped! Tracking ID: ${trackingId}. Track: app.orgobloom.com/track`,

  orderDelivered: (orderId: string) =>
    `Your order #${orderId} has been delivered. Thank you for shopping at Orgobloom!`,

  orderCancelled: (orderId: string) =>
    `Your order #${orderId} has been cancelled. Refund will be processed within 3-5 days.`,

  refundInitiated: (amount: string, days: number = 5) =>
    `Refund of ${amount} initiated. It will be credited within ${days} days.`,

  verificationCode: (code: string, minutes: number = 10) =>
    `Your Orgobloom verification code is ${code}. Valid for ${minutes} minutes. Do not share.`,

  passwordReset: (link: string, minutes: number = 30) =>
    `Click to reset your password: ${link} (Valid for ${minutes} minutes)`,

  promotionalOffer: (offer: string) =>
    `Special offer for you: ${offer}. Shop now at Orgobloom!`,

  supportTicketCreated: (ticketId: string) =>
    `We've received your support request #${ticketId}. Our team will respond soon.`,

  supportTicketResolved: (ticketId: string) =>
    `Your support ticket #${ticketId} has been resolved. Thank you for using Orgobloom!`,
};
