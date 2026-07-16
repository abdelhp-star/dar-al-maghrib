import { Router } from "express";
import { db, cartItemsTable, menuItemsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authenticate, type JwtPayload } from "../middlewares/auth";

const router = Router();

const DELIVERY_FEE = 15;

async function buildCart(userId: number) {
  const items = await db.select({
    menuItemId: cartItemsTable.menuItemId,
    quantity: cartItemsTable.quantity,
    menuItem: {
      id: menuItemsTable.id,
      name: menuItemsTable.name,
      nameAr: menuItemsTable.nameAr,
      nameFr: menuItemsTable.nameFr,
      description: menuItemsTable.description,
      descriptionAr: menuItemsTable.descriptionAr,
      descriptionFr: menuItemsTable.descriptionFr,
      price: menuItemsTable.price,
      imageUrl: menuItemsTable.imageUrl,
      categoryId: menuItemsTable.categoryId,
      available: menuItemsTable.available,
      spiceLevel: menuItemsTable.spiceLevel,
      preparationTime: menuItemsTable.preparationTime,
      calories: menuItemsTable.calories,
      ingredients: menuItemsTable.ingredients,
      isPopular: menuItemsTable.isPopular,
      isFeatured: menuItemsTable.isFeatured,
      isTodaySpecial: menuItemsTable.isTodaySpecial,
      createdAt: menuItemsTable.createdAt,
    },
  })
    .from(cartItemsTable)
    .leftJoin(menuItemsTable, eq(cartItemsTable.menuItemId, menuItemsTable.id))
    .where(eq(cartItemsTable.userId, userId));

  const cartItems = items.filter(i => i.menuItem !== null).map(i => ({
    menuItemId: i.menuItemId,
    quantity: i.quantity,
    menuItem: { ...i.menuItem!, price: parseFloat(i.menuItem!.price as any), avgRating: null, reviewCount: 0 },
  }));

  const subtotal = cartItems.reduce((sum, i) => sum + parseFloat(i.menuItem.price as any) * i.quantity, 0);
  return {
    items: cartItems,
    subtotal: Math.round(subtotal * 100) / 100,
    deliveryFee: DELIVERY_FEE,
    discount: 0,
    total: Math.round((subtotal + DELIVERY_FEE) * 100) / 100,
  };
}

// GET /api/cart
router.get("/cart", authenticate, async (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const cart = await buildCart(user.id);
    res.json(cart);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/cart
router.delete("/cart", authenticate, async (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    await db.delete(cartItemsTable).where(eq(cartItemsTable.userId, user.id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/cart/items
router.post("/cart/items", authenticate, async (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const { menuItemId, quantity } = req.body;
    if (!menuItemId || !quantity) { res.status(400).json({ error: "menuItemId and quantity required" }); return; }

    const existing = await db.select().from(cartItemsTable)
      .where(and(eq(cartItemsTable.userId, user.id), eq(cartItemsTable.menuItemId, menuItemId))).limit(1);

    if (existing.length > 0) {
      await db.update(cartItemsTable)
        .set({ quantity: existing[0].quantity + quantity })
        .where(and(eq(cartItemsTable.userId, user.id), eq(cartItemsTable.menuItemId, menuItemId)));
    } else {
      await db.insert(cartItemsTable).values({ userId: user.id, menuItemId, quantity });
    }

    const cart = await buildCart(user.id);
    res.json(cart);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/cart/items/:menuItemId
router.patch("/cart/items/:menuItemId", authenticate, async (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const menuItemId = parseInt(String(req.params.menuItemId));
    const { quantity } = req.body;
    if (quantity <= 0) {
      await db.delete(cartItemsTable).where(and(eq(cartItemsTable.userId, user.id), eq(cartItemsTable.menuItemId, menuItemId)));
    } else {
      await db.update(cartItemsTable).set({ quantity }).where(and(eq(cartItemsTable.userId, user.id), eq(cartItemsTable.menuItemId, menuItemId)));
    }
    const cart = await buildCart(user.id);
    res.json(cart);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/cart/items/:menuItemId
router.delete("/cart/items/:menuItemId", authenticate, async (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const menuItemId = parseInt(String(req.params.menuItemId));
    await db.delete(cartItemsTable).where(and(eq(cartItemsTable.userId, user.id), eq(cartItemsTable.menuItemId, menuItemId)));
    const cart = await buildCart(user.id);
    res.json(cart);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
