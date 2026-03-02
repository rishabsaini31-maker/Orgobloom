import "module-alias/register";
import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import http from "http";
import { randomUUID } from "crypto";
import { errorHandler } from "./middleware/errorHandler.js";
import { connectRedis } from "./utils/redis.js";
import { initializeSocket } from "./utils/notifications.js";
import { config } from "./config/env.js";

dotenv.config();

// Validate environment variables immediately at startup
// This will throw with detailed errors if required vars are missing
console.log("🔍 Validating environment configuration...");

// Connect to Redis FIRST - before importing rate limiters
await connectRedis();

// Import rate limiters AFTER Redis is connected
const { apiLimiter } = await import("./middleware/rateLimiter.js");

// Import routes AFTER rate limiters are ready
const authRoutes = (await import("./routes/auth.js")).default;
const productRoutes = (await import("./routes/products.js")).default;
const adminRoutes = (await import("./routes/admin.js")).default;
const profileRoutes = (await import("./routes/profile.js")).default;
const customersRoutes = (await import("./routes/customers.js")).default;
const ordersRoutes = (await import("./routes/orders.js")).default;
const addressesRoutes = (await import("./routes/addresses.js")).default;
const emailRoutes = (await import("./routes/email.js")).default;
const siteMediaRoutes = (await import("./routes/siteMedia.js")).default;
const paymentRoutes = (await import("./routes/payments.js")).default;
const blogRoutes = (await import("./routes/blogs.js")).default;
const bulkRoutes = (await import("./routes/bulk.js")).default;
const searchRoutes = (await import("./routes/search.js")).default;
const auditLogsRoutes = (await import("./routes/auditLogs.js")).default;
const shipmentsRoutes = (await import("./routes/shipments.js")).default;
const webhooksRoutes = (await import("./routes/webhooks.js")).default;
const stripeRoutes = (await import("./routes/stripe.js")).default;
const shiprocketRoutes = (await import("./routes/shiprocket.js")).default;
const delhiveryRoutes = (await import("./routes/delhivery.js")).default;
const refundRoutes = (await import("./routes/refunds.js")).default;
const fshipRoutes = (await import("./routes/fship.js")).default;

const app = express();
app.set("etag", false);
const server = http.createServer(app);
const PORT = config.PORT;

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
    config.FRONTEND_URL,
    config.ADMIN_URL,
  ].filter(Boolean) as string[];

  // In development, allow all origins
  if (config.NODE_ENV !== "production") {
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
    callback(new Error("Not allowed by CORS"));
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

app.use((req, res, next) => {
  const incomingRequestId = req.get("x-request-id");
  const requestId = incomingRequestId || randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("x-request-id", requestId);
  next();
});

// Health check endpoint (before rate limiting to avoid throttling)
app.get("/health", (req: Request, res: Response) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Health check for monitoring tools
app.get("/api/healthz", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

// Apply rate limiting to all routes
app.use("/api/", apiLimiter);

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

server.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🔗 Admin URL: ${process.env.ADMIN_URL}`);

  // Initialize Socket.io
  initializeSocket(server);
  console.log(`🔌 Socket.io initialized`);
});

export default app;
