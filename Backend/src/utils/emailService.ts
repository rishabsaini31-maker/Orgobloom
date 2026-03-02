import nodemailer from "nodemailer";

// Initialize transporter
const initializeTransporter = () => {
  const isProduction = process.env.NODE_ENV === "production";

  if (isProduction || process.env.SMTP_PASSWORD) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      throw new Error(
        "SMTP_USER/SMTP_PASSWORD missing. Configure email credentials in environment variables.",
      );
    }

    // Production: Use Gmail/SMTP with credentials
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: process.env.SMTP_SECURE === "true", // false for TLS, true for SSL
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  } else {
    // Development: Use Ethereal (test email service)
    console.warn(
      "⚠️  Using Ethereal for email testing. Set SMTP_PASSWORD for production.",
    );
    return nodemailer.createTestAccount().then((testAccount) => {
      return nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    });
  }
};

let transporter: any = null;

export const getTransporter = async () => {
  if (!transporter) {
    transporter = await initializeTransporter();

    try {
      await transporter.verify();
      console.log("✅ SMTP transporter verified");
    } catch (error) {
      console.error("❌ SMTP verification failed:", error);
      throw error;
    }
  }
  return transporter;
};

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  try {
    const transporter = await getTransporter();

    const mailOptions = {
      from: process.env.SMTP_FROM || `Orgobloom <${process.env.SMTP_USER}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
    };

    const sendPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error("Email send timeout after 15 seconds")),
        15000,
      );
    });

    const info: any = await Promise.race([sendPromise, timeoutPromise]);

    console.log("✅ Email sent:", {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
    });

    // Log preview URL for Ethereal emails in development
    if (process.env.NODE_ENV !== "production" && info.response) {
      console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
    }

    return true;
  } catch (error) {
    console.error("❌ Email sending failed:", error);
    return false;
  }
};

export const sendBulkEmails = async (
  recipients: string[],
  subject: string,
  html: string,
): Promise<{ success: number; failed: number }> => {
  let success = 0;
  let failed = 0;

  for (const recipient of recipients) {
    const sent = await sendEmail({
      to: recipient,
      subject,
      html,
    });

    if (sent) {
      success++;
    } else {
      failed++;
    }
  }

  return { success, failed };
};
