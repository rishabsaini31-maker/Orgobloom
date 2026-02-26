import { db } from "./db.js";
import { users } from "./db/schema/users.js";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

async function updateAdminCredentials() {
  try {
    console.log("🔄 Updating admin credentials...");

    // Test connection
    await db.execute(sql`SELECT 1`);
    console.log("✅ Database connection successful");

    const adminEmail = process.env.ADMIN_EMAIL || "admin@orgobloom.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Admin@123456";

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Find existing admin with new email
    const existingAdminWithNewEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, adminEmail))
      .limit(1);

    if (existingAdminWithNewEmail.length > 0) {
      // Admin already exists with this email, just update the password
      await db
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.email, adminEmail));

      console.log("✅ Admin credentials updated successfully");
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      return;
    }

    // Find the first admin user (by role)
    const existingAdmins = await db
      .select()
      .from(users)
      .where(eq(users.role, "ADMIN"))
      .limit(1);

    if (existingAdmins.length > 0) {
      // Update existing admin with new email and password
      await db
        .update(users)
        .set({
          email: adminEmail,
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingAdmins[0].id));

      console.log("✅ Admin credentials updated successfully");
      console.log(`📧 Email: ${adminEmail}`);
      console.log(`🔑 Password: ${adminPassword}`);
      return;
    }

    // No admin exists, create one
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
    console.error("❌ Failed to update admin credentials:", error);
    throw error;
  }
}

updateAdminCredentials()
  .then(() => {
    console.log("\n✅ Admin credentials update complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Update failed:", error);
    process.exit(1);
  });
