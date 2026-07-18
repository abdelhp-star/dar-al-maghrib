import { Router } from "express";
import { db, menuItemsTable, categoriesTable, reviewsTable } from "@workspace/db";
import { eq, ilike, and, sql } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router = Router();

function formatItem(item: any, category?: any) {
  return {
    ...item,
    price: parseFloat(item.price),
    avgRating: item.avgRating ? parseFloat(item.avgRating) : null,
    reviewCount: item.reviewCount ?? 0,
    category: category ?? undefined,
  };
}

// GET /api/menu-items/featured — must be before /:id
router.get("/menu-items/featured", async (req, res) => {
  try {
    const all = await db.select({
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
      avgRating: sql<number>`(SELECT AVG(rating) FROM reviews WHERE menu_item_id = ${menuItemsTable.id})`,
      reviewCount: sql<number>`(SELECT COUNT(*) FROM reviews WHERE menu_item_id = ${menuItemsTable.id})::int`,
    }).from(menuItemsTable).where(eq(menuItemsTable.available, true));

    res.json({
      todaySpecials: all.filter(i => i.isTodaySpecial).slice(0, 6).map(i => formatItem(i)),
      popular: all.filter(i => i.isPopular).slice(0, 8).map(i => formatItem(i)),
      featured: all.filter(i => i.isFeatured).slice(0, 6).map(i => formatItem(i)),
      recommended: all.slice(0, 8).map(i => formatItem(i)),
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/menu-items — returns only available items by default; pass available=false to include hidden
router.get("/menu-items", async (req, res) => {
  try {
    const { categoryId, search, available, spiceLevel } = req.query;
    const conditions: any[] = [];
    if (categoryId) conditions.push(eq(menuItemsTable.categoryId, parseInt(categoryId as string)));
    if (available !== "false") conditions.push(eq(menuItemsTable.available, true));
    if (spiceLevel) conditions.push(eq(menuItemsTable.spiceLevel, spiceLevel as any));

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
      avgRating: sql<number>`(SELECT AVG(rating) FROM reviews WHERE menu_item_id = ${menuItemsTable.id})`,
      reviewCount: sql<number>`(SELECT COUNT(*) FROM reviews WHERE menu_item_id = ${menuItemsTable.id})::int`,
      categoryName: categoriesTable.name,
      categoryNameAr: categoriesTable.nameAr,
      categoryNameFr: categoriesTable.nameFr,
      categoryIcon: categoriesTable.icon,
    })
      .from(menuItemsTable)
      .leftJoin(categoriesTable, eq(menuItemsTable.categoryId, categoriesTable.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    let result = items;
    if (search) {
      const q = (search as string).toLowerCase();
      result = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.nameAr.includes(q) ||
        i.nameFr.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q)
      );
    }

    res.json(result.map(i => formatItem(i, i.categoryName ? {
      id: i.categoryId, name: i.categoryName, nameAr: i.categoryNameAr, nameFr: i.categoryNameFr,
      icon: i.categoryIcon, imageUrl: null, sortOrder: 0, active: true, itemCount: 0
    } : undefined)));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/menu-items/:id
router.get("/menu-items/:id", async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const [item] = await db.select({
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
      avgRating: sql<number>`(SELECT AVG(rating) FROM reviews WHERE menu_item_id = ${menuItemsTable.id})`,
      reviewCount: sql<number>`(SELECT COUNT(*) FROM reviews WHERE menu_item_id = ${menuItemsTable.id})::int`,
      categoryName: categoriesTable.name,
      categoryNameAr: categoriesTable.nameAr,
      categoryNameFr: categoriesTable.nameFr,
      categoryIcon: categoriesTable.icon,
    })
      .from(menuItemsTable)
      .leftJoin(categoriesTable, eq(menuItemsTable.categoryId, categoriesTable.id))
      .where(eq(menuItemsTable.id, id))
      .limit(1);
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatItem(item, item.categoryName ? {
      id: item.categoryId, name: item.categoryName, nameAr: item.categoryNameAr, nameFr: item.categoryNameFr,
      icon: item.categoryIcon, imageUrl: null, sortOrder: 0, active: true, itemCount: 0
    } : undefined));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/menu-items (admin)
router.post("/menu-items", authenticate, requireAdmin, async (req, res) => {
  try {
    const body = req.body;
    const [item] = await db.insert(menuItemsTable).values({
      name: body.name, nameAr: body.nameAr, nameFr: body.nameFr,
      description: body.description, descriptionAr: body.descriptionAr, descriptionFr: body.descriptionFr,
      price: body.price.toString(), imageUrl: body.imageUrl, categoryId: body.categoryId,
      available: body.available ?? true, spiceLevel: body.spiceLevel ?? "none",
      preparationTime: body.preparationTime ?? 20, calories: body.calories,
      ingredients: body.ingredients ?? "", isPopular: body.isPopular ?? false,
      isFeatured: body.isFeatured ?? false, isTodaySpecial: body.isTodaySpecial ?? false,
    }).returning();
    res.status(201).json(formatItem(item));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/menu-items/:id (admin)
router.patch("/menu-items/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const body = req.body;
    const updateData: any = {};
    const fields = ["name","nameAr","nameFr","description","descriptionAr","descriptionFr","imageUrl","categoryId","available","spiceLevel","preparationTime","calories","ingredients","isPopular","isFeatured","isTodaySpecial"];
    for (const f of fields) { if (body[f] !== undefined) updateData[f] = f === "price" ? body[f].toString() : body[f]; }
    if (body.price !== undefined) updateData.price = body.price.toString();
    const [item] = await db.update(menuItemsTable).set(updateData).where(eq(menuItemsTable.id, id)).returning();
    if (!item) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatItem(item));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/menu-items/:id (admin)
router.delete("/menu-items/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(menuItemsTable).where(eq(menuItemsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
