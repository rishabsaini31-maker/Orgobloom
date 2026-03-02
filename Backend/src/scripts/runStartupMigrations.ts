import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { db } from "../db/index.js";

dotenv.config();

async function runStartupMigrations() {
  console.log("🔄 Running startup migrations script...");

  await db.execute(sql`
    ALTER TABLE site_media
    ADD COLUMN IF NOT EXISTS image_settings TEXT;
  `);

  await db.execute(sql`
    ALTER TABLE site_media
    ADD COLUMN IF NOT EXISTS content_settings TEXT;
  `);

  await db.execute(sql`
    ALTER TABLE site_media
    ADD COLUMN IF NOT EXISTS seo_settings TEXT;
  `);

  await db.execute(sql`
    ALTER TABLE site_media
    ADD COLUMN IF NOT EXISTS intro_video_poster TEXT;
  `);

  await db.execute(sql`
    ALTER TABLE site_media
    ADD COLUMN IF NOT EXISTS intro_video_urls TEXT;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS app_settings (
      id TEXT PRIMARY KEY,
      app_name TEXT,
      app_description TEXT,
      logo TEXT,
      primary_color TEXT DEFAULT '#3b82f6',
      secondary_color TEXT DEFAULT '#10b981',
      accent_color TEXT DEFAULT '#f59e0b',
      email_from TEXT,
      support_email TEXT,
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

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS blogs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT,
      content TEXT NOT NULL,
      featured_image TEXT,
      featured_image_alt TEXT,
      category TEXT DEFAULT 'General',
      tags JSONB,
      author TEXT DEFAULT 'Orgobloom Team',
      meta_title TEXT,
      meta_description TEXT,
      published BOOLEAN DEFAULT false,
      featured BOOLEAN DEFAULT false,
      read_time INTEGER DEFAULT 5,
      view_count INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      published_at TIMESTAMP
    );
  `);

  await db.execute(sql`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'blogs' AND column_name = 'tags' AND data_type = 'text'
      ) THEN
        ALTER TABLE blogs ALTER COLUMN tags TYPE JSONB USING
          CASE WHEN tags IS NULL THEN NULL
          ELSE to_jsonb(tags::text)
          END;
      END IF;
    END $$;
  `);

  await db.execute(sql`
    ALTER TABLE blogs
    ADD COLUMN IF NOT EXISTS featured_image_alt TEXT;
  `);

  await db.execute(sql`
    ALTER TABLE blogs
    ADD COLUMN IF NOT EXISTS meta_title TEXT;
  `);

  await db.execute(sql`
    ALTER TABLE blogs
    ADD COLUMN IF NOT EXISTS meta_description TEXT;
  `);

  await db.execute(sql`
    ALTER TABLE blogs
    ADD COLUMN IF NOT EXISTS read_time INTEGER DEFAULT 5;
  `);

  await db.execute(sql`
    ALTER TABLE blogs
    ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      action VARCHAR(50) NOT NULL,
      entity_type VARCHAR(50) NOT NULL,
      entity_id UUID,
      entity_name VARCHAR(255),
      description TEXT NOT NULL,
      old_values JSONB,
      new_values JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS webhooks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      url TEXT NOT NULL,
      secret TEXT NOT NULL,
      events JSONB NOT NULL DEFAULT '[]',
      status TEXT DEFAULT 'active',
      description TEXT,
      headers JSONB,
      retry_count TEXT DEFAULT '3',
      retry_delay TEXT DEFAULT '1000',
      timeout TEXT DEFAULT '30000',
      last_delivery_at TIMESTAMP,
      last_delivery_status TEXT,
      failure_count TEXT DEFAULT '0',
      created_by TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id TEXT PRIMARY KEY,
      webhook_id TEXT NOT NULL,
      event TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      payload JSONB NOT NULL,
      request_headers JSONB,
      response_status_code TEXT,
      response_body TEXT,
      response_headers JSONB,
      error_message TEXT,
      attempt_number TEXT DEFAULT '1',
      duration TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      delivered_at TIMESTAMP
    );
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS integrations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      api_key TEXT,
      api_secret TEXT,
      api_endpoint TEXT,
      config JSONB,
      webhook_url TEXT,
      webhook_secret TEXT,
      last_sync_at TIMESTAMP,
      created_by TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );
  `);

  console.log("✅ Startup migrations completed");
}

runStartupMigrations()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Startup migrations failed:", error);
    process.exit(1);
  });
