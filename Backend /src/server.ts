import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
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
import fraudRoutes from "./modules/fraud/fraud.routes.js";

// Import fraud middleware
import {
  comprehensiveFraudCheck,
  enrichUserWithFraudStatus,
} from "./modules/fraud/fraud.middleware.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      process.env.ADMIN_URL || "http://localhost:3001",
    ],
    credentials: true,
  }),
);
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiting to all routes
app.use("/api/", apiLimiter);

// Fraud enrichment middleware - adds fraud context to all requests
app.use(enrichUserWithFraudStatus);

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/user", profileRoutes);
app.use("/api/customers", customersRoutes);
app.use("/api/admin/fraud", fraudRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler (must be last)
app.use(errorHandler);

// Test database connection
async function testDBConnection() {
  try {
    await db.execute(sql`SELECT 1`);
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    process.exit(1);
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
