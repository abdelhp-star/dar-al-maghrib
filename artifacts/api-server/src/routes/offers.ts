import { Router } from "express";
import { db, offersTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router = Router();

// GET /api/offers — returns active offers; pass ?all=true to include inactive (admin)
router.get("/offers", async (req, res) => {
  try {
    const includeAll = req.query.all === "true";
    const offers = await db.select().from(offersTable)
      .where(includeAll ? undefined : eq(offersTable.active, true))
      .orderBy(desc(offersTable.createdAt));
    res.json(offers);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/offers (admin)
router.post("/offers", authenticate, requireAdmin, async (req, res) => {
  try {
    const { title, titleAr, titleFr, description, descriptionAr, descriptionFr, imageUrl, discountPercent, active, expiresAt } = req.body;
    const [offer] = await db.insert(offersTable).values({
      title, titleAr, titleFr, description, descriptionAr: descriptionAr ?? "", descriptionFr: descriptionFr ?? "",
      imageUrl, discountPercent, active: active ?? true, expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    }).returning();
    res.status(201).json(offer);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/offers/:id (admin)
router.patch("/offers/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const body = req.body;
    const updateData: any = {};
    const fields = ["title","titleAr","titleFr","description","descriptionAr","descriptionFr","imageUrl","discountPercent","active"];
    for (const f of fields) { if (body[f] !== undefined) updateData[f] = body[f]; }
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    const [offer] = await db.update(offersTable).set(updateData).where(eq(offersTable.id, id)).returning();
    if (!offer) { res.status(404).json({ error: "Not found" }); return; }
    res.json(offer);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/offers/:id (admin)
router.delete("/offers/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(offersTable).where(eq(offersTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
