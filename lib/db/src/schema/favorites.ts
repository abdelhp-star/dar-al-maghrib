import { pgTable, integer, timestamp, serial } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { menuItemsTable } from "./menuItems";

export const favoritesTable = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItemsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Favorite = typeof favoritesTable.$inferSelect;
