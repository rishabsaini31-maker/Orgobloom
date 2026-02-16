import * as dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

let db: any;
let migrationClient: any = null;

try {
  const postgres = require("postgres");

  // Configure postgres connection with connection pooling settings
  const queryClient = postgres(databaseUrl, {
    max: 20, // Connection pool size
  });

  const { drizzle } = require("drizzle-orm/postgres-js");
  db = drizzle(queryClient);

  migrationClient = postgres(databaseUrl, {
    max: 1,
  });

  console.log("✅ Connected to Neon PostgreSQL");
} catch (error) {
  console.error("❌ Failed to connect to Neon PostgreSQL:", error);
  throw new Error("Database connection failed");
}

export { db, migrationClient };
