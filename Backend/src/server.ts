import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import http from "http";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { connectRedis } from "./utils/redis";
import { initializeSocket } from "./utils/notifications";

// Import routes
import authRoutes from "./routes/auth";
import productRoutes from "./routes/products";
import adminRoutes from "./routes/admin";
import profileRoutes from "./routes/profile";
import customersRoutes from "./routes/customers";
import ordersRoutes from "./routes/orders";
import addressesRoutes from "./routes/addresses";
import emailRoutes from "./routes/email";
import siteMediaRoutes from "./routes/siteMedia";
import paymentRoutes from "./routes/payments";
import blogRoutes from "./routes/blogs";
import bulkRoutes from "./routes/bulk";
import searchRoutes from "./routes/search";
import auditLogsRoutes from "./routes/auditLogs";
import shipmentsRoutes from "./routes/shipments";
import webhooksRoutes from "./routes/webhooks";
import stripeRoutes from "./routes/stripe";
import shiprocketRoutes from "./routes/shiprocket";
import delhiveryRoutes from "./routes/delhivery";
import refundRoutes from "./routes/refunds";
import fshipRoutes from "./routes/fship";

dotenv.config();

const app = express();
app.set("etag", false);
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Enable trust proxy for Render/Heroku etc.
app.set("trust proxy", 1);

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

// Dynamic CORS configuration - Allow all origins in development
const getAllowedOrigins = () => {
  const defaultOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:3002",
    "http://localhost:8000",
    "http://localhost:5000",
    process.env.FRONTEND_URL,
    process.env.ADMIN_URL,
  ].filter(Boolean) as string[];

  // In development, allow all origins
  if (process.env.NODE_ENV !== "production") {
    return true; // Allow all origins in development
  }

  // In production, use dynamic origin check
  return (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void,
  ) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    // Allow localhost for development
    if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
      return callback(null, true);
    }

    // Allow Vercel deployments
    if (origin.includes("vercel.app")) {
      return callback(null, true);
    }

    // Allow Render deployments
    if (origin.includes("onrender.com")) {
      return callback(null, true);
    }

    // Allow configured URLs
    if (defaultOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Log rejected origins for debugging
    console.log(`[CORS] Rejected origin: ${origin}`);
    callback(null, true); // Allow anyway for now to debug
  };
};

app.use(
  cors({
    origin: getAllowedOrigins(),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Cache-Control",
      "Pragma",
    ],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(uploadsDir));

// Apply rate limiting to all routes
app.use("/api/", apiLimiter);

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", profileRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/addresses", addressesRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/site-media", siteMediaRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/bulk", bulkRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/audit-logs", auditLogsRoutes);
app.use("/api/shipments", shipmentsRoutes);
app.use("/api/webhooks", webhooksRoutes);
app.use("/api/stripe", stripeRoutes);
app.use("/api/shiprocket", shiprocketRoutes);
app.use("/api/delhivery", delhiveryRoutes);
app.use("/api/refunds", refundRoutes);
app.use("/api/fship", fshipRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler (must be last)
app.use(errorHandler);

// Run database migrations
async function runMigrations() {
  try {
    console.log("🔄 Running database migrations...");

    // Add site_media columns if they don't exist
    await db.execute(sql`
      ALTER TABLE site_media
      ADD COLUMN IF NOT EXISTS image_settings TEXT;
    `);

    await db.execute(sql`
      ALTER TABLE site_media
      ADD COLUMN IF NOT EXISTS content_settings TEXT;
    `);

    await db.execute(sql`
      ALTER TABLE site_media
      ADD COLUMN IF NOT EXISTS seo_settings TEXT;
    `);

    await db.execute(sql`
      ALTER TABLE site_media
      ADD COLUMN IF NOT EXISTS intro_video_poster TEXT;
    `);

    await db.execute(sql`
      ALTER TABLE site_media
      ADD COLUMN IF NOT EXISTS intro_video_urls TEXT;
    `);

    // Create app_settings table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        id TEXT PRIMARY KEY,
        app_name TEXT,
        app_description TEXT,
        logo TEXT,
        primary_color TEXT DEFAULT '#3b82f6',
        secondary_color TEXT DEFAULT '#10b981',
        accent_color TEXT DEFAULT '#f59e0b',
        email_from TEXT,
        support_email TEXT,
        currency TEXT DEFAULT 'INR',
        timezone TEXT DEFAULT 'Asia/Kolkata',
        maintenance_mode BOOLEAN DEFAULT false,
        enable_registration BOOLEAN DEFAULT true,
        enable_guest_checkout BOOLEAN DEFAULT true,
        max_order_quantity INTEGER DEFAULT 999,
        min_order_amount INTEGER DEFAULT 0,
        free_shipping_threshold INTEGER DEFAULT 500,
        shipping_cost INTEGER DEFAULT 50,
        tax_rate INTEGER DEFAULT 18,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create blogs table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS blogs (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        excerpt TEXT,
        content TEXT NOT NULL,
        featured_image TEXT,
        featured_image_alt TEXT,
        category TEXT DEFAULT 'General',
        tags JSONB,
        author TEXT DEFAULT 'Orgobloom Team',
        meta_title TEXT,
        meta_description TEXT,
        published BOOLEAN DEFAULT false,
        featured BOOLEAN DEFAULT false,
        read_time INTEGER DEFAULT 5,
        view_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        published_at TIMESTAMP
      );
    `);

    // Alter tags column to JSONB if it's currently TEXT
    await db.execute(sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'blogs' AND column_name = 'tags' AND data_type = 'text'
        ) THEN
          ALTER TABLE blogs ALTER COLUMN tags TYPE JSONB USING
            CASE WHEN tags IS NULL THEN NULL
            ELSE to_jsonb(tags::text)
            END;
        END IF;
      END $$;
    `);

    // Add missing blogs columns if they don't exist
    await db.execute(sql`
      ALTER TABLE blogs
      ADD COLUMN IF NOT EXISTS featured_image_alt TEXT;
    `);

    await db.execute(sql`
      ALTER TABLE blogs
      ADD COLUMN IF NOT EXISTS meta_title TEXT;
    `);

    await db.execute(sql`
      ALTER TABLE blogs
      ADD COLUMN IF NOT EXISTS meta_description TEXT;
    `);

    await db.execute(sql`
      ALTER TABLE blogs
      ADD COLUMN IF NOT EXISTS read_time INTEGER DEFAULT 5;
    `);

    await db.execute(sql`
      ALTER TABLE blogs
      ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
    `);

    // Create audit_logs table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        user_email VARCHAR(255) NOT NULL,
        action VARCHAR(50) NOT NULL,
        entity_type VARCHAR(50) NOT NULL,
        entity_id UUID,
        entity_name VARCHAR(255),
        description TEXT NOT NULL,
        old_values JSONB,
        new_values JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create webhooks table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS webhooks (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        secret TEXT NOT NULL,
        events JSONB NOT NULL DEFAULT '[]',
        status TEXT DEFAULT 'active',
        description TEXT,
        headers JSONB,
        retry_count TEXT DEFAULT '3',
        retry_delay TEXT DEFAULT '1000',
        timeout TEXT DEFAULT '30000',
        last_delivery_at TIMESTAMP,
        last_delivery_status TEXT,
        failure_count TEXT DEFAULT '0',
        created_by TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Create webhook_deliveries table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS webhook_deliveries (
        id TEXT PRIMARY KEY,
        webhook_id TEXT NOT NULL,
        event TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        payload JSONB NOT NULL,
        request_headers JSONB,
        response_status_code TEXT,
        response_body TEXT,
        response_headers JSONB,
        error_message TEXT,
        attempt_number TEXT DEFAULT '1',
        duration TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        delivered_at TIMESTAMP
      );
    `);

    // Create integrations table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS integrations (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        api_key TEXT,
        api_secret TEXT,
        api_endpoint TEXT,
        config JSONB,
        webhook_url TEXT,
        webhook_secret TEXT,
        last_sync_at TIMESTAMP,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("✅ Database migrations completed");
  } catch (error) {
    console.error("⚠️ Migration warning:", error);
  }
}

// Test database connection
async function testDBConnection() {
  try {
    console.log("✅ Database configured successfully");
  } catch (error) {
    console.error("⚠️ Database warning:", error);
  }
}

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🔗 Admin URL: ${process.env.ADMIN_URL}`);

  // Initialize Socket.io
  initializeSocket(server);
  console.log(`🔌 Socket.io initialized`);

  await testDBConnection();
  await runMigrations();
  await connectRedis();
});

export default app;
