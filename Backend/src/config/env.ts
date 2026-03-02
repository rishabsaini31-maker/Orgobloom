import { z } from "zod";

/**
 * Environment variable schema with validation
 * Ensures all required variables are set and have correct types
 */
const envSchema = z
  .object({
    // Server
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),
    PORT: z.string().transform(Number).default("5000"),

    // Database
    DATABASE_URL: z.string().url("Invalid database URL"),

    // JWT & Auth
    JWT_SECRET: z
      .string()
      .min(32, "JWT_SECRET must be at least 32 characters")
      .default("default-jwt-secret-change-in-production"),

    // Redis
    REDIS_URL: z.string().url("Invalid Redis URL").optional(),
    UPSTASH_REDIS_URL: z.string().optional(),
    UPSTASH_REDIS_TOKEN: z.string().optional(),

    // Email
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z
      .string()
      .optional()
      .transform((v) => (v ? Number(v) : undefined)),
    SMTP_USER: z.string().optional(),
    SMTP_PASSWORD: z.string().optional(),
    SMTP_SECURE: z.string().optional(),
    ADMIN_EMAIL: z.string().email().optional(),

    // OAuth
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // Frontend & Admin URLs
    FRONTEND_URL: z.string().url().optional(),
    ADMIN_URL: z.string().url().optional(),

    // Stripe
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_PUBLISHABLE_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),

    // External APIs
    SHIPROCKET_API_KEY: z.string().optional(),
    DELHIVERY_API_KEY: z.string().optional(),
    FSHIP_API_KEY: z.string().optional(),

    // Sentry (error tracking)
    SENTRY_DSN: z.string().url().optional(),

    // Analytics
    ANALYTICS_ENABLED: z
      .string()
      .optional()
      .transform((v) => v === "true"),
  })
  .strict()
  .superRefine((data, ctx) => {
    // Production-specific validations
    if (data.NODE_ENV === "production") {
      if (!data.SMTP_USER || !data.SMTP_PASSWORD) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["SMTP_USER"],
          message: "SMTP credentials required in production",
        });
      }

      if (
        !data.JWT_SECRET ||
        data.JWT_SECRET === "default-jwt-secret-change-in-production"
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["JWT_SECRET"],
          message: "JWT_SECRET must be changed in production",
        });
      }

      if (!data.DATABASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["DATABASE_URL"],
          message: "DATABASE_URL required in production",
        });
      }
    }
  });

export type EnvConfig = z.infer<typeof envSchema>;

/**
 * Parse and validate environment variables
 * Throws detailed error if validation fails
 */
export function loadEnv(): EnvConfig {
  try {
    const parsed = envSchema.parse(process.env);

    console.log(`
╔════════════════════════════════════════════════════╗
║          Environment Configuration Loaded          ║
╚════════════════════════════════════════════════════╝
✅ NODE_ENV: ${parsed.NODE_ENV}
✅ PORT: ${parsed.PORT}
✅ DATABASE_URL: ${parsed.DATABASE_URL ? "✓ Configured" : "✗ Missing"}
✅ JWT_SECRET: ${parsed.JWT_SECRET ? "✓ Configured (length: " + parsed.JWT_SECRET.length + ")" : "✗ Missing"}
✅ Redis: ${parsed.REDIS_URL || parsed.UPSTASH_REDIS_URL ? "✓ Configured" : "⚠️ Optional"}
✅ Email: ${parsed.SMTP_USER ? "✓ SMTP Configured" : "⚠️ Using Ethereal (dev only)"}
✅ Frontend URL: ${parsed.FRONTEND_URL ? "✓ Configured" : "⚠️ Not set"}
✅ Admin URL: ${parsed.ADMIN_URL ? "✓ Configured" : "⚠️ Not set"}
    `);

    // Production warnings
    if (parsed.NODE_ENV === "production") {
      console.log("🔒 PRODUCTION MODE - Security checks:");
      console.log(`   ✓ Database: Configured`);
      console.log(`   ✓ JWT Secret: Protected`);
      console.log(`   ✓ Email: SMTP Credentials Set`);
    }

    return parsed;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("\n❌ ENVIRONMENT VARIABLE VALIDATION FAILED:\n");
      error.errors.forEach((err) => {
        console.error(`   ${err.path.join(".")}: ${err.message}`);
      });
      console.error("\n📋 Check your .env file and try again.\n");

      // Provide helpful suggestions
      if (error.errors.some((e) => e.path.includes("DATABASE_URL"))) {
        console.error(
          "💡 Tip: Ensure DATABASE_URL is set to your Supabase PostgreSQL connection string",
        );
      }
      if (error.errors.some((e) => e.path.includes("JWT_SECRET"))) {
        console.error(
          "💡 Tip: Generate a secure JWT_SECRET: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
        );
      }

      process.exit(1);
    }
    throw error;
  }
}

/**
 * Get config value with type-safe access
 * Replaces process.env with type-checked alternative
 */
export const config = loadEnv();

export default config;
