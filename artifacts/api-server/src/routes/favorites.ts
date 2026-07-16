import { Router } from "express";
import { db, favoritesTable, menuItemsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { authenticate, type JwtPayload } from "../middlewares/auth";

const router = Router();

// GET /api/favorites
router.get("/favorites", authenticate, async (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const items = await db.select({
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
    })
      .from(favoritesTable)
      .innerJoin(menuItemsTable, eq(favoritesTable.menuItemId, menuItemsTable.id))
      .where(eq(favoritesTable.userId, user.id));

    res.json(items.map(i => ({ ...i, price: parseFloat(i.price as any), avgRating: null, reviewCount: 0 })));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/favorites/:menuItemId
router.post("/favorites/:menuItemId", authenticate, async (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const menuItemId = parseInt(String(req.params.menuItemId));
    const existing = await db.select().from(favoritesTable)
      .where(and(eq(favoritesTable.userId, user.id), eq(favoritesTable.menuItemId, menuItemId))).limit(1);
    if (existing.length === 0) {
      await db.insert(favoritesTable).values({ userId: user.id, menuItemId });
    }
    res.json({ message: "Added to favorites" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/favorites/:menuItemId
router.delete("/favorites/:menuItemId", authenticate, async (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const menuItemId = parseInt(String(req.params.menuItemId));
    await db.delete(favoritesTable).where(and(eq(favoritesTable.userId, user.id), eq(favoritesTable.menuItemId, menuItemId)));
    res.json({ message: "Removed from favorites" });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
