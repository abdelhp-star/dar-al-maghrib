import { Router } from "express";
import { db, ordersTable, orderItemsTable, usersTable, menuItemsTable, reviewsTable } from "@workspace/db";
import { eq, desc, gte, sql } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router = Router();

function formatOrder(order: any, items: any[]) {
  return {
    ...order,
    subtotal: parseFloat(order.subtotal),
    deliveryFee: parseFloat(order.deliveryFee),
    discount: parseFloat(order.discount),
    total: parseFloat(order.total),
    items: items.map(i => ({
      ...i,
      unitPrice: parseFloat(i.unitPrice),
      totalPrice: parseFloat(i.totalPrice),
    })),
  };
}

// GET /api/admin/orders
router.get("/admin/orders", authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const orders = await db.select().from(ordersTable)
      .where(status ? eq(ordersTable.status, status as any) : undefined)
      .orderBy(desc(ordersTable.createdAt));
    const result = await Promise.all(orders.map(async o => {
      const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, o.id));
      return formatOrder(o, items);
    }));
    res.json(result);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/admin/orders/:id/status
router.patch("/admin/orders/:id/status", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { status } = req.body;
    const [order] = await db.update(ordersTable)
      .set({ status, updatedAt: new Date() })
      .where(eq(ordersTable.id, id))
      .returning();
    if (!order) { res.status(404).json({ error: "Not found" }); return; }
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
    res.json(formatOrder(order, items));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/customers
router.get("/admin/customers", authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      address: usersTable.address,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    }).from(usersTable).where(eq(usersTable.role, "customer")).orderBy(desc(usersTable.createdAt));
    res.json(users);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/admin/stats
router.get("/admin/stats", authenticate, requireAdmin, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalsRow] = await db.select({
      totalOrders: sql<number>`COUNT(*)::int`,
      totalRevenue: sql<number>`COALESCE(SUM(total)::numeric, 0)`,
      pendingOrders: sql<number>`COUNT(*) FILTER (WHERE status = 'pending')::int`,
      todayOrders: sql<number>`COUNT(*) FILTER (WHERE created_at >= ${today})::int`,
      todayRevenue: sql<number>`COALESCE(SUM(total) FILTER (WHERE created_at >= ${today})::numeric, 0)`,
    }).from(ordersTable);

    const [customerCount] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(usersTable).where(eq(usersTable.role, "customer"));

    const statusCounts = await db.select({
      status: ordersTable.status,
      count: sql<number>`COUNT(*)::int`,
    }).from(ordersTable).groupBy(ordersTable.status);

    // Revenue by day (last 7 days)
    const revenueByDay = await db.execute(sql`
      SELECT 
        DATE(created_at)::text as date,
        COALESCE(SUM(total), 0)::numeric as revenue,
        COUNT(*)::int as orders
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    // Top items
    const topItems = await db.execute(sql`
      SELECT 
        oi.menu_item_id as "menuItemId",
        oi.menu_item_name as name,
        oi.menu_item_image_url as "imageUrl",
        SUM(oi.quantity)::int as "totalOrdered",
        SUM(oi.total_price)::numeric as revenue
      FROM order_items oi
      GROUP BY oi.menu_item_id, oi.menu_item_name, oi.menu_item_image_url
      ORDER BY "totalOrdered" DESC
      LIMIT 5
    `);

    res.json({
      totalOrders: totalsRow.totalOrders ?? 0,
      totalRevenue: parseFloat(String(totalsRow.totalRevenue)) || 0,
      totalCustomers: customerCount.count ?? 0,
      pendingOrders: totalsRow.pendingOrders ?? 0,
      todayOrders: totalsRow.todayOrders ?? 0,
      todayRevenue: parseFloat(String(totalsRow.todayRevenue)) || 0,
      ordersByStatus: statusCounts.map(s => ({ status: s.status, count: s.count })),
      revenueByDay: (revenueByDay.rows as any[]).map(r => ({ date: r.date, revenue: parseFloat(r.revenue), orders: r.orders })),
      topItems: (topItems.rows as any[]).map(r => ({ menuItemId: r.menuItemId, name: r.name, imageUrl: r.imageUrl, totalOrdered: r.totalOrdered, revenue: parseFloat(r.revenue) })),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/admin/reviews/:id
router.delete("/admin/reviews/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(reviewsTable).where(eq(reviewsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
