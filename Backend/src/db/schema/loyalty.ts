import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";
import { users } from "./users";

// Loyalty Points Table
export const loyaltyPoints = pgTable(
  "loyalty_points",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    points: integer("points").notNull(), // Positive for earned, negative for redeemed
    balance: integer("balance").notNull(), // Running balance

    // Source of points
    source: text("source").notNull(), // 'purchase', 'bonus', 'referral', 'redeemed', 'expired'
    referenceId: text("reference_id"), // Order ID or referral ID

    // Points value
    pointsValue: integer("points_value"), // Value in rupees

    // Expiry
    expiresAt: timestamp("expires_at"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_loyalty_user_id").on(table.userId),
    sourceIdx: index("idx_loyalty_source").on(table.source),
    expiresAtIdx: index("idx_loyalty_expires_at").on(table.expiresAt),
  }),
);

// Loyalty Tiers
export const loyaltyTiers = pgTable("loyalty_tiers", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(), // Bronze, Silver, Gold, Platinum
  minPoints: integer("min_points").notNull(),
  maxPoints: integer("max_points"),

  // Benefits
  pointsMultiplier: integer("points_multiplier").default(1).notNull(), // 1x, 1.5x, 2x
  discountPercent: integer("discount_percent").default(0).notNull(),
  freeShipping: integer("free_shipping_threshold"), // Order value for free shipping

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User Loyalty Profile
export const userLoyalty = pgTable(
  "user_loyalty",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => createId()),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),

    totalPointsEarned: integer("total_points_earned").default(0).notNull(),
    currentBalance: integer("current_balance").default(0).notNull(),
    tierId: text("tier_id").references(() => loyaltyTiers.id),

    // Stats
    totalRedeemed: integer("total_redeemed").default(0).notNull(),
    totalExpired: integer("total_expired").default(0).notNull(),

    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("idx_user_loyalty_user_id").on(table.userId),
    tierIdx: index("idx_user_loyalty_tier").on(table.tierId),
  }),
);

export type LoyaltyPoint = typeof loyaltyPoints.$inferSelect;
export type NewLoyaltyPoint = typeof loyaltyPoints.$inferInsert;
export type LoyaltyTier = typeof loyaltyTiers.$inferSelect;
export type UserLoyalty = typeof userLoyalty.$inferSelect;