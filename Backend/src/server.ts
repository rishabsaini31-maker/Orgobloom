import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { errorHandler } from "./middleware/errorHandler";
import { apiLimiter } from "./middleware/rateLimiter";
import { db } from "./db";
import { sql } from "drizzle-orm";

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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const uploadsDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      process.env.ADMIN_URL || "http://localhost:3002",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ],
    credentials: true,
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

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler (must be last)
app.use(errorHandler);

// Test database connection
async function testDBConnection() {
  try {
    console.log("✅ Database configured successfully");
  } catch (error) {
    console.error("⚠️ Database warning:", error);
  }
}

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`🔗 Admin URL: ${process.env.ADMIN_URL}`);
  await testDBConnection();
});

export default app;
