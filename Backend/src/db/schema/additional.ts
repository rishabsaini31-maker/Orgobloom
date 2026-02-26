import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users.js";
import { orders, orderStatusEnum } from "./orders.js";

export const orderStatusHistory = pgTable("order_status_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  status: orderStatusEnum("status").notNull(),
  notes: text("notes"),
  createdBy: text("created_by"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").default("info").notNull(),
  isRead: text("is_read").default("false").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const recentlyViewed = pgTable("recently_viewed", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

export const siteMedia = pgTable("site_media", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  introVideoUrl: text("intro_video_url"),
  // Store multiple video URLs as JSON array
  introVideoUrls: text("intro_video_urls"), // JSON array of video URLs
  // Poster/thumbnail image for intro video
  introVideoPoster: text("intro_video_poster"),
  // Image Settings (JSON)
  imageSettings: text("image_settings"), // JSON object with heroImage, whyChooseUsImage, etc.
  // Content Settings (JSON)
  contentSettings: text("content_settings"), // JSON object with heroTitle, heroSubtitle, etc.
  // SEO Settings (JSON)
  seoSettings: text("seo_settings"), // JSON object with meta titles, descriptions, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type OrderStatusHistory = typeof orderStatusHistory.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type RecentlyViewed = typeof recentlyViewed.$inferSelect;
export type SiteMedia = typeof siteMedia.$inferSelect;
