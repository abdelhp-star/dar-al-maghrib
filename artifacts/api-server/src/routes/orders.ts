import { Router } from "express";
import { db, ordersTable, orderItemsTable, cartItemsTable, menuItemsTable, couponsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { authenticate, type JwtPayload } from "../middlewares/auth";

const router = Router();

const DELIVERY_FEE = 15;

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

// GET /api/orders
router.get("/orders", authenticate, async (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, user.id)).orderBy(desc(ordersTable.createdAt));
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

// POST /api/orders
router.post("/orders", authenticate, async (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const { orderType, paymentMethod, customerName, customerPhone, customerEmail, deliveryAddress, deliveryNotes, couponCode } = req.body;

    // Get cart items
    const cartItems = await db.select({
      menuItemId: cartItemsTable.menuItemId,
      quantity: cartItemsTable.quantity,
      price: menuItemsTable.price,
      name: menuItemsTable.name,
      imageUrl: menuItemsTable.imageUrl,
    })
      .from(cartItemsTable)
      .leftJoin(menuItemsTable, eq(cartItemsTable.menuItemId, menuItemsTable.id))
      .where(eq(cartItemsTable.userId, user.id));

    if (cartItems.length === 0) {
      res.status(400).json({ error: "Cart is empty" });
      return;
    }

    const subtotal = cartItems.reduce((sum, i) => sum + parseFloat(i.price as any) * i.quantity, 0);
    const fee = orderType === "delivery" ? DELIVERY_FEE : 0;
    let discount = 0;

    // Validate coupon
    if (couponCode) {
      const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, couponCode.toUpperCase())).limit(1);
      if (coupon && coupon.active) {
        if (coupon.discountType === "percentage") {
          discount = Math.round((subtotal * parseFloat(coupon.discountValue as any) / 100) * 100) / 100;
        } else {
          discount = Math.min(parseFloat(coupon.discountValue as any), subtotal);
        }
        await db.update(couponsTable).set({ usedCount: coupon.usedCount + 1 }).where(eq(couponsTable.id, coupon.id));
      }
    }

    const total = Math.round((subtotal + fee - discount) * 100) / 100;

    const [order] = await db.insert(ordersTable).values({
      userId: user.id,
      orderType,
      paymentMethod,
      customerName,
      customerPhone,
      customerEmail,
      deliveryAddress,
      deliveryNotes,
      couponCode: couponCode?.toUpperCase(),
      subtotal: subtotal.toString(),
      deliveryFee: fee.toString(),
      discount: discount.toString(),
      total: total.toString(),
      estimatedDeliveryTime: orderType === "delivery" ? 45 : 20,
    }).returning();

    const orderItems = await db.insert(orderItemsTable).values(
      cartItems.map(i => ({
        orderId: order.id,
        menuItemId: i.menuItemId,
        menuItemName: i.name!,
        menuItemImageUrl: i.imageUrl,
        quantity: i.quantity,
        unitPrice: parseFloat(i.price as any).toString(),
        totalPrice: (parseFloat(i.price as any) * i.quantity).toString(),
      }))
    ).returning();

    // Clear cart
    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, user.id));

    res.status(201).json(formatOrder(order, orderItems));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/orders/:id
router.get("/orders/:id", authenticate, async (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const id = parseInt(String(req.params.id));
    const [order] = await db.select().from(ordersTable)
      .where(and(eq(ordersTable.id, id), eq(ordersTable.userId, user.id))).limit(1);
    if (!order) { res.status(404).json({ error: "Not found" }); return; }
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
    res.json(formatOrder(order, items));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/orders/:id/cancel
router.patch("/orders/:id/cancel", authenticate, async (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const id = parseInt(String(req.params.id));
    const [order] = await db.update(ordersTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(and(eq(ordersTable.id, id), eq(ordersTable.userId, user.id)))
      .returning();
    if (!order) { res.status(404).json({ error: "Not found" }); return; }
    const items = await db.select().from(orderItemsTable).where(eq(orderItemsTable.orderId, id));
    res.json(formatOrder(order, items));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
