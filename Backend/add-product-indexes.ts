import { db } from "./src/db/index.js";
import { sql } from "drizzle-orm";

async function addProductIndexes() {
  console.log("🔄 Adding database indexes for better performance...");

  try {
    // Add index on isActive for faster filtering of active products
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);`,
    );
    console.log("✅ Added index on is_active");

    // Add index on isFeatured for faster filtering of featured products
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured);`,
    );
    console.log("✅ Added index on is_featured");

    // Add index on category for faster category filtering
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);`,
    );
    console.log("✅ Added index on category");

    // Add index on slug for faster lookups by slug
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);`,
    );
    console.log("✅ Added index on slug");

    // Add index on created_at for faster sorting by date
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);`,
    );
    console.log("✅ Added index on created_at");

    // Add composite index for common query pattern (active + featured)
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_products_active_featured ON products(is_active, is_featured);`,
    );
    console.log("✅ Added composite index on is_active + is_featured");

    // Add text search index for name (using GIN for better full-text search)
    await db.execute(
      sql`CREATE INDEX IF NOT EXISTS idx_products_name_gin ON products USING gin(to_tsvector('english', name));`,
    );
    console.log("✅ Added full-text search index on name");

    console.log("\n🚀 All indexes added successfully!");
    console.log("📊 Product queries should now be much faster!");
  } catch (error) {
    console.error("❌ Error adding indexes:", error);
    throw error;
  } finally {
    process.exit(0);
  }
}

addProductIndexes();
