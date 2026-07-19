import { Router } from "express";
import { db, categoriesTable, menuItemsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authenticate, requireAdmin, verifyToken } from "../middlewares/auth";

const router = Router();

// GET /api/categories — returns active categories; pass ?all=true to include inactive (admin-only)
router.get("/categories", async (req, res) => {
  try {
    const wantsAll = req.query.all === "true";
    // Only authenticated admins may request inactive categories
    let includeAll = false;
    if (wantsAll) {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith("Bearer ")) {
        try {
          const payload = verifyToken(authHeader.slice(7));
          if ((payload as any).role === "admin") includeAll = true;
        } catch { /* not authenticated — fall through to active-only */ }
      }
    }
    const categories = await db.select({
      id: categoriesTable.id,
      name: categoriesTable.name,
      nameAr: categoriesTable.nameAr,
      nameFr: categoriesTable.nameFr,
      icon: categoriesTable.icon,
      imageUrl: categoriesTable.imageUrl,
      sortOrder: categoriesTable.sortOrder,
      active: categoriesTable.active,
      itemCount: sql<number>`(SELECT COUNT(*) FROM menu_items WHERE category_id = ${categoriesTable.id} AND available = true)::int`,
    }).from(categoriesTable)
      .where(includeAll ? undefined : eq(categoriesTable.active, true))
      .orderBy(categoriesTable.sortOrder);
    res.json(categories);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/categories (admin)
router.post("/categories", authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, nameAr, nameFr, icon, imageUrl, sortOrder, active } = req.body;
    if (!name || !nameAr || !nameFr || !icon) {
      res.status(400).json({ error: "name, nameAr, nameFr, icon are required" });
      return;
    }
    const [cat] = await db.insert(categoriesTable).values({ name, nameAr, nameFr, icon, imageUrl, sortOrder: sortOrder ?? 0, active: active ?? true }).returning();
    res.status(201).json({ ...cat, itemCount: 0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/categories/:id (admin)
router.patch("/categories/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const { name, nameAr, nameFr, icon, imageUrl, sortOrder, active } = req.body;
    const [cat] = await db.update(categoriesTable)
      .set({ ...(name && { name }), ...(nameAr && { nameAr }), ...(nameFr && { nameFr }), ...(icon && { icon }), imageUrl, ...(sortOrder !== undefined && { sortOrder }), ...(active !== undefined && { active }) })
      .where(eq(categoriesTable.id, id))
      .returning();
    if (!cat) { res.status(404).json({ error: "Not found" }); return; }
    res.json({ ...cat, itemCount: 0 });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/categories/:id (admin)
router.delete("/categories/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(categoriesTable).where(eq(categoriesTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
