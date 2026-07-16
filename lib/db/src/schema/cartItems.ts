import { pgTable, serial, integer, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { menuItemsTable } from "./menuItems";

export const cartItemsTable = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItemsTable.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type CartItem = typeof cartItemsTable.$inferSelect;
