import { db } from "./src/db";
import { sql } from "drizzle-orm";

/**
 * Migration script to add site settings columns to site_media table
 * Run with: npx tsx add-site-settings-columns.ts
 */

async function migrate() {
  console.log("Starting migration to add site settings columns...");

  try {
    // Add image_settings column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE site_media 
      ADD COLUMN IF NOT EXISTS image_settings TEXT;
    `);
    console.log("✅ Added image_settings column");

    // Add content_settings column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE site_media 
      ADD COLUMN IF NOT EXISTS content_settings TEXT;
    `);
    console.log("✅ Added content_settings column");

    // Add seo_settings column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE site_media 
      ADD COLUMN IF NOT EXISTS seo_settings TEXT;
    `);
    console.log("✅ Added seo_settings column");

    // Add intro_video_poster column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE site_media 
      ADD COLUMN IF NOT EXISTS intro_video_poster TEXT;
    `);
    console.log("✅ Added intro_video_poster column");

    // Add intro_video_urls column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE site_media 
      ADD COLUMN IF NOT EXISTS intro_video_urls TEXT;
    `);
    console.log("✅ Added intro_video_urls column");

    console.log("\n🎉 Migration completed successfully!");
    console.log("\nYou can now save settings from Admin > Customize App");
    
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }

  process.exit(0);
}

migrate();