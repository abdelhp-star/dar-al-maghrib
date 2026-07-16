import { pgTable, serial, text, integer, boolean, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { categoriesTable } from "./categories";

export const spiceLevelEnum = pgEnum("spice_level", ["none", "mild", "medium", "hot", "very_hot"]);

export const menuItemsTable = pgTable("menu_items", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  nameFr: text("name_fr").notNull(),
  description: text("description").notNull(),
  descriptionAr: text("description_ar").notNull(),
  descriptionFr: text("description_fr").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  categoryId: integer("category_id").notNull().references(() => categoriesTable.id),
  available: boolean("available").notNull().default(true),
  spiceLevel: spiceLevelEnum("spice_level").notNull().default("none"),
  preparationTime: integer("preparation_time").notNull().default(20),
  calories: integer("calories"),
  ingredients: text("ingredients").notNull().default(""),
  isPopular: boolean("is_popular").notNull().default(false),
  isFeatured: boolean("is_featured").notNull().default(false),
  isTodaySpecial: boolean("is_today_special").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMenuItemSchema = createInsertSchema(menuItemsTable).omit({ id: true, createdAt: true });
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItem = typeof menuItemsTable.$inferSelect;
