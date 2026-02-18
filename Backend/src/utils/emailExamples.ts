/**
 * EMAIL INTEGRATION EXAMPLES
 *
 * This file demonstrates how to integrate the email system
 * with your existing routes (auth, orders, customers, etc.)
 */

import { sendEmail } from "../utils/emailService";
import { emailTemplates } from "../templates/emailTemplates";
import axios from "axios";

// ===== Example 1: Send Welcome Email on User Signup =====
export const sendWelcomeEmailExample = async (
  userEmail: string,
  userName: string,
) => {
  const template = emailTemplates.welcomeEmail(userName);

  const success = await sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  if (success) {
    console.log(`✅ Welcome email sent to ${userEmail}`);
  } else {
    console.error(`❌ Failed to send welcome email to ${userEmail}`);
  }

  return success;
};

// ===== Example 2: Send Password Reset Email =====
export const sendPasswordResetEmailExample = async (
  userEmail: string,
  userName: string,
  resetToken: string,
) => {
  // Generate reset link (adjust URL based on your frontend)
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

  const template = emailTemplates.passwordResetEmail(userName, resetLink);

  const success = await sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return success;
};

// ===== Example 3: Send Order Confirmation Email =====
export const sendOrderConfirmationExample = async (
  userEmail: string,
  userName: string,
  orderId: string,
  items: Array<{ name: string; quantity: number; price: number }>,
  total: number,
) => {
  // Calculate estimated delivery (e.g., 5 days from now)
  const estimatedDelivery = new Date();
  estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);
  const deliveryDate = estimatedDelivery.toLocaleDateString("en-IN");

  const template = emailTemplates.orderConfirmationEmail(
    userName,
    orderId,
    items,
    total,
    deliveryDate,
  );

  const success = await sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return success;
};

// ===== Example 4: Send Shipping Notification =====
export const sendShippingNotificationExample = async (
  userEmail: string,
  userName: string,
  orderId: string,
  trackingNumber: string,
  carrier: string = "Standard Shipping",
) => {
  const template = emailTemplates.shippingNotificationEmail(
    userName,
    orderId,
    trackingNumber,
    carrier,
  );

  const success = await sendEmail({
    to: userEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return success;
};

// ===== Example 5: Send Contact Form Reply =====
export const sendContactFormReplyExample = async (
  visitorEmail: string,
  visitorName: string,
  visitorMessage: string,
) => {
  const template = emailTemplates.contactFormReplyEmail(
    visitorName,
    visitorMessage,
  );

  const success = await sendEmail({
    to: visitorEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return success;
};

// ===== Example 6: Send Admin Notification =====
export const sendAdminNotificationExample = async (
  adminEmail: string,
  subject: string,
  content: string,
) => {
  const template = emailTemplates.adminNotificationEmail(
    "Orgobloom Admin",
    subject,
    content,
  );

  const success = await sendEmail({
    to: adminEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });

  return success;
};

// ===== Example 7: Using the Email API Directly =====
export const sendEmailViaAPI = async (
  templateType: string,
  to: string,
  data: any,
) => {
  try {
    const response = await axios.post(
      `${process.env.BACKEND_URL || "http://localhost:8000"}/api/email/send`,
      {
        to,
        templateType,
        data,
      },
    );

    return response.data;
  } catch (error) {
    console.error("❌ Failed to send email via API:", error);
    throw error;
  }
};

// ===== Example 8: Integration in Auth Route =====
/*
// In routes/auth.ts
import { Router } from 'express';
import { sendWelcomeEmailExample } from '../utils/emailExamples';

const router = Router();

router.post('/register', async (req, res) => {
  try {
    const { email, name, password } = req.body;

    // Create user in database
    // const user = await createUser(email, name, hashedPassword);

    // Send welcome email
    await sendWelcomeEmailExample(email, name);

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Welcome email sent.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
*/

// ===== Example 9: Integration in Orders Route =====
/*
// In routes/orders.ts
import { Router } from 'express';
import {
  sendOrderConfirmationExample,
  sendAdminNotificationExample,
} from '../utils/emailExamples';

const router = Router();

router.post('/create', async (req, res) => {
  try {
    const { userEmail, userName, items, total } = req.body;

    // Create order in database
    // const order = await createOrder(userData, items);
    // const orderId = order.id;

    // Send order confirmation to customer
    await sendOrderConfirmationExample(
      userEmail,
      userName,
      orderId,
      items,
      total
    );

    // Send notification to admin
    await sendAdminNotificationExample(
      process.env.ADMIN_EMAIL || 'admin@orgobloom.com',
      'New Order Alert',
      `A new order #${orderId} has been placed for ₹${total}`
    );

    res.status(201).json({
      success: true,
      orderId,
      message: 'Order created and confirmation emails sent.',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
*/

// ===== Example 10: Bulk Email Sending =====
export const sendBulkNewsletterExample = async (
  recipients: string[],
  templateType: string,
) => {
  try {
    const result = await axios.post("http://localhost:8000/api/email/send", {
      to: recipients, // API accepts array
      templateType,
      data: {},
    });

    return result.data;
  } catch (error) {
    console.error("Failed to send bulk emails:", error);
    throw error;
  }
};

/**
 * QUICK START CHECKLIST
 *
 * 1. ✅ Email service is set up in src/utils/emailService.ts
 * 2. ✅ Email templates are created in src/templates/emailTemplates.ts
 * 3. ✅ API routes are added in src/routes/email.ts
 * 4. ✅ Routes are registered in src/server.ts
 *
 * NEXT STEPS:
 * 1. Copy these examples to your route files
 * 2. Call email functions after successful operations
 * 3. Test with POST /api/email/test
 * 4. Copy a working Gmail app password to SMTP_PASSWORD in .env
 *
 * TEST THE SYSTEM:
 *
 * curl -X POST http://localhost:8000/api/email/test \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "to": "your-email@gmail.com",
 *     "subject": "Test Email",
 *     "message": "Email system is working!"
 *   }'
 *
 */
