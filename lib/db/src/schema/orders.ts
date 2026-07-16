import { pgTable, serial, integer, text, timestamp, numeric, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { menuItemsTable } from "./menuItems";

export const orderStatusEnum = pgEnum("order_status", [
  "pending", "accepted", "preparing", "out_for_delivery", "delivered", "cancelled"
]);

export const orderTypeEnum = pgEnum("order_type", ["delivery", "pickup"]);

export const paymentMethodEnum = pgEnum("payment_method", ["online", "cash_on_delivery"]);

export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "failed"]);

export const ordersTable = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id),
  status: orderStatusEnum("status").notNull().default("pending"),
  orderType: orderTypeEnum("order_type").notNull().default("delivery"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("cash_on_delivery"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerEmail: text("customer_email").notNull(),
  deliveryAddress: text("delivery_address"),
  deliveryNotes: text("delivery_notes"),
  couponCode: text("coupon_code"),
  subtotal: numeric("subtotal", { precision: 10, scale: 2 }).notNull(),
  deliveryFee: numeric("delivery_fee", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  estimatedDeliveryTime: integer("estimated_delivery_time"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItemsTable = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  menuItemId: integer("menu_item_id").notNull().references(() => menuItemsTable.id),
  menuItemName: text("menu_item_name").notNull(),
  menuItemImageUrl: text("menu_item_image_url"),
  quantity: integer("quantity").notNull(),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: numeric("total_price", { precision: 10, scale: 2 }).notNull(),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
export type OrderItem = typeof orderItemsTable.$inferSelect;
