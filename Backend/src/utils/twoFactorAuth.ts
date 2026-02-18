import { authenticator } from "otplib";
import QRCode from "qrcode";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "./emailService";

// Two-Factor Authentication Service
export const twoFactorAuth = {
  // Generate secret for TOTP
  generateSecret: (email: string): string => {
    const secret = authenticator.generateSecret();
    return secret;
  },

  // Generate QR Code URL
  generateQRCodeUrl: (email: string, secret: string): string => {
    const serviceName = "Orgobloom";
    return authenticator.keyuri(email, serviceName, secret);
  },

  // Generate QR Code as Data URL
  generateQRCodeDataUrl: async (
    email: string,
    secret: string,
  ): Promise<string> => {
    const otpauthUrl = twoFactorAuth.generateQRCodeUrl(email, secret);
    return QRCode.toDataURL(otpauthUrl);
  },

  // Verify TOTP token
  verifyToken: (token: string, secret: string): boolean => {
    try {
      // Allow some time drift (30 seconds window)
      authenticator.options = {
        window: 1,
      };
      return authenticator.verify({ token, secret });
    } catch (error) {
      console.error("TOTP verification error:", error);
      return false;
    }
  },

  // Enable 2FA for user
  enable2FA: async (
    userId: string,
    secret: string,
    token: string,
  ): Promise<boolean> => {
    // Verify the token first
    if (!twoFactorAuth.verifyToken(token, secret)) {
      return false;
    }

    // Store secret in database (in production, encrypt this!)
    await db
      .update(users)
      .set({
        // Note: You'll need to add twoFactorSecret and twoFactorEnabled columns to users table
        // For now, we'll use a JSON field or create a migration
      } as any)
      .where(eq(users.id, userId));

    return true;
  },

  // Disable 2FA for user
  disable2FA: async (userId: string): Promise<void> => {
    await db
      .update(users)
      .set({
        // Clear 2FA fields
      } as any)
      .where(eq(users.id, userId));
  },

  // Generate backup codes
  generateBackupCodes: (): string[] => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  },

  // Send 2FA code via email (alternative to TOTP)
  send2FACodeEmail: async (email: string, code: string): Promise<void> => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Two-Factor Authentication Code</h2>
        <p>Your verification code is:</p>
        <div style="background: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #2563eb; letter-spacing: 5px; margin: 0;">${code}</h1>
          <p style="color: #999; margin: 10px 0 0 0;">This code expires in 5 minutes</p>
        </div>
        <p style="color: #999; font-size: 12px;">If you didn't request this code, please secure your account immediately.</p>
      </div>
    `;

    await sendEmail({
      to: email,
      subject: "Your 2FA Code: " + code,
      html,
      text: `Your verification code is: ${code}\n\nThis code expires in 5 minutes.`,
    });
  },

  // Generate 6-digit code for email 2FA
  generateEmailCode: (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  },
};

// Store for email 2FA codes (use Redis in production)
const email2FACodes = new Map<
  string,
  { code: string; expires: number; attempts: number }
>();

// Email 2FA Store
export const email2FAStore = {
  // Store code
  set: async (userId: string, code: string): Promise<void> => {
    email2FACodes.set(userId, {
      code,
      expires: Date.now() + 300000, // 5 minutes
      attempts: 0,
    });
  },

  // Get code
  get: async (
    userId: string,
  ): Promise<{ code: string; expires: number; attempts: number } | null> => {
    return email2FACodes.get(userId) || null;
  },

  // Verify code
  verify: async (
    userId: string,
    code: string,
  ): Promise<{ valid: boolean; reason?: string }> => {
    const stored = email2FACodes.get(userId);

    if (!stored) {
      return {
        valid: false,
        reason: "No code found. Please request a new one.",
      };
    }

    if (Date.now() > stored.expires) {
      email2FACodes.delete(userId);
      return {
        valid: false,
        reason: "Code expired. Please request a new one.",
      };
    }

    if (stored.attempts >= 5) {
      email2FACodes.delete(userId);
      return {
        valid: false,
        reason: "Too many attempts. Please request a new code.",
      };
    }

    if (stored.code !== code) {
      stored.attempts++;
      return { valid: false, reason: "Invalid code." };
    }

    // Valid - delete the code
    email2FACodes.delete(userId);
    return { valid: true };
  },

  // Delete code
  delete: async (userId: string): Promise<void> => {
    email2FACodes.delete(userId);
  },
};

export default twoFactorAuth;
