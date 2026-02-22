import { db } from "./src/db";
import { sql } from "drizzle-orm";

/**
 * Migration script to add app_settings table
 * Run with: npx tsx add-app-settings-table.ts
 */

async function migrate() {
  console.log("Creating app_settings table...");

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS app_settings (
        id TEXT PRIMARY KEY,
        app_name TEXT DEFAULT 'Orgobloom',
        app_description TEXT DEFAULT 'Premium organic products marketplace',
        logo TEXT,
        primary_color TEXT DEFAULT '#3b82f6',
        secondary_color TEXT DEFAULT '#10b981',
        accent_color TEXT DEFAULT '#f59e0b',
        email_from TEXT DEFAULT 'noreply@orgobloom.com',
        support_email TEXT DEFAULT 'support@orgobloom.com',
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

    console.log("✅ app_settings table created successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating app_settings table:", error);
    process.exit(1);
  }
}

migrate();
