import {
  pgTable,
  text,
  timestamp,
  integer,
  boolean,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users.js";
import { products } from "./products.js";

export const reviews = pgTable(
  "reviews",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    productId: text("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),

    rating: integer("rating").notNull(), // 1-5 stars
    title: text("title"),
    comment: text("comment").notNull(),

    // Moderation
    isApproved: boolean("is_approved").default(false).notNull(),
    isFeatured: boolean("is_featured").default(false).notNull(),

    // Helpful votes
    helpfulCount: integer("helpful_count").default(0).notNull(),

    // Images
    images: text("images").array(),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    productIdIdx: index("idx_reviews_product_id").on(table.productId),
    userIdIdx: index("idx_reviews_user_id").on(table.userId),
    ratingIdx: index("idx_reviews_rating").on(table.rating),
  }),
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
