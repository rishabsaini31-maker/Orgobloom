import { db } from "./db/index.js";
import { users } from "./db/schema/users.js";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

async function setupDatabase() {
  try {
    console.log("🔄 Setting up database...");

    // Test connection
    await db.execute(sql`SELECT 1`);
    console.log("✅ Database connection successful");

    // Create admin user
    const adminEmail = process.env.ADMIN_EMAIL || "admin@orgobloom.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";

    // Check if admin already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(sql`${users.email} = ${adminEmail}`)
      .limit(1);

    if (existingAdmin.length > 0) {
      console.log("ℹ️  Admin user already exists");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    await db.insert(users).values({
      email: adminEmail,
      name: "Admin",
      password: hashedPassword,
      role: "ADMIN",
      emailVerified: new Date(),
    });

    console.log("✅ Admin user created successfully");
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
  } catch (error) {
    console.error("❌ Database setup failed:", error);
    throw error;
  }
}

setupDatabase()
  .then(() => {
    console.log("\n✅ Database setup complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Setup failed:", error);
    process.exit(1);
  });
