import postgres from "postgres";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!, { max: 1 });

async function runMigration() {
  try {
    console.log("🔄 Running database migration...");

    const schemaSQL = fs.readFileSync(
      path.join(__dirname, "..", "schema.sql"),
      "utf8"
    );

    await sql.unsafe(schemaSQL);

    console.log("✅ Database tables created successfully!");

    // Close connection
    await sql.end();
  } catch (error) {
    console.error("❌ Migration failed:", error);
    await sql.end();
    process.exit(1);
  }
}

runMigration();
