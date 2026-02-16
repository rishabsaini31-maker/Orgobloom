import {
  pgTable,
  text,
  real,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createId } from "@paralleldrive/cuid2";

export const products = pgTable("products", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  price: real("price").notNull(),
  weight: text("weight").notNull(),
  stock: integer("stock").default(0).notNull(),
  imageUrl: text("image_url"),
  images: text("images").array(),
  category: text("category").default("cow").notNull(),

  // Product details
  benefits: text("benefits").array(),
  usage: text("usage"),
  composition: text("composition"),

  // Status
  isActive: boolean("is_active").default(true).notNull(),
  isFeatured: boolean("is_featured").default(false).notNull(),

  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
