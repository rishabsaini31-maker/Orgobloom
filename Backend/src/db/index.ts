import * as dotenv from "dotenv";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL environment variable is required");
}

const queryClient = postgres(databaseUrl, { max: 20 });
const db = drizzle(queryClient);
const migrationClient = postgres(databaseUrl, { max: 1 });

console.log("✅ Connected to Supabase PostgreSQL");

export { db, migrationClient };
