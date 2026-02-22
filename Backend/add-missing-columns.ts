import { db } from "./src/db";
import { sql } from "drizzle-orm";

/**
 * Migration script to add all missing columns to the database
 * Run with: npx tsx add-missing-columns.ts
 */

async function migrate() {
  console.log("Starting migration to add missing columns...\n");

  try {
    // ==========================================
    // 1. Add columns to site_media table
    // ==========================================
    console.log("📦 Updating site_media table...");

    try {
      await db.execute(
        sql`ALTER TABLE site_media ADD COLUMN IF NOT EXISTS intro_video_url TEXT`,
      );
      console.log("  ✅ Added intro_video_url column");
    } catch (e) {
      console.log("  ⏭️  intro_video_url already exists or table not found");
    }

    try {
      await db.execute(
        sql`ALTER TABLE site_media ADD COLUMN IF NOT EXISTS intro_video_urls TEXT`,
      );
      console.log("  ✅ Added intro_video_urls column");
    } catch (e) {
      console.log("  ⏭️  intro_video_urls already exists");
    }

    try {
      await db.execute(
        sql`ALTER TABLE site_media ADD COLUMN IF NOT EXISTS intro_video_poster TEXT`,
      );
      console.log("  ✅ Added intro_video_poster column");
    } catch (e) {
      console.log("  ⏭️  intro_video_poster already exists");
    }

    try {
      await db.execute(
        sql`ALTER TABLE site_media ADD COLUMN IF NOT EXISTS image_settings TEXT`,
      );
      console.log("  ✅ Added image_settings column");
    } catch (e) {
      console.log("  ⏭️  image_settings already exists");
    }

    try {
      await db.execute(
        sql`ALTER TABLE site_media ADD COLUMN IF NOT EXISTS content_settings TEXT`,
      );
      console.log("  ✅ Added content_settings column");
    } catch (e) {
      console.log("  ⏭️  content_settings already exists");
    }

    try {
      await db.execute(
        sql`ALTER TABLE site_media ADD COLUMN IF NOT EXISTS seo_settings TEXT`,
      );
      console.log("  ✅ Added seo_settings column");
    } catch (e) {
      console.log("  ⏭️  seo_settings already exists");
    }

    // ==========================================
    // 2. Add columns to products table
    // ==========================================
    console.log("\n📦 Updating products table...");

    try {
      await db.execute(
        sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS compare_price REAL`,
      );
      console.log("  ✅ Added compare_price column");
    } catch (e) {
      console.log("  ⏭️  compare_price already exists");
    }

    try {
      await db.execute(
        sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS image_alt_text TEXT`,
      );
      console.log("  ✅ Added image_alt_text column");
    } catch (e) {
      console.log("  ⏭️  image_alt_text already exists");
    }

    try {
      await db.execute(
        sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_title TEXT`,
      );
      console.log("  ✅ Added meta_title column");
    } catch (e) {
      console.log("  ⏭️  meta_title already exists");
    }

    try {
      await db.execute(
        sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS meta_description TEXT`,
      );
      console.log("  ✅ Added meta_description column");
    } catch (e) {
      console.log("  ⏭️  meta_description already exists");
    }

    // ==========================================
    // 3. Create blogs table if not exists
    // ==========================================
    console.log("\n📦 Creating blogs table if not exists...");

    try {
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS blogs (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          excerpt TEXT,
          content TEXT NOT NULL,
          featured_image TEXT,
          category TEXT DEFAULT 'General',
          tags TEXT[],
          author TEXT,
          author_id TEXT,
          meta_title TEXT,
          meta_description TEXT,
          published BOOLEAN DEFAULT false,
          featured BOOLEAN DEFAULT false,
          read_time INTEGER DEFAULT 5,
          view_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log("  ✅ Created blogs table");
    } catch (e) {
      console.log("  ⏭️  blogs table already exists or error:", e);
    }

    console.log("\n🎉 Migration completed successfully!");
    console.log("\nYou can now:");
    console.log("  1. Restart your backend server");
    console.log("  2. Use Admin > Customize App to save settings");
    console.log(
      "  3. Create products with compare price, alt text, meta fields",
    );
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }

  process.exit(0);
}

migrate();
