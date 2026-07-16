import { Router } from "express";
import { db, reviewsTable, usersTable, menuItemsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { authenticate, requireAdmin, type JwtPayload } from "../middlewares/auth";

const router = Router();

// GET /api/reviews
router.get("/reviews", async (req, res) => {
  try {
    const { menuItemId } = req.query;
    const reviews = await db.select({
      id: reviewsTable.id,
      userId: reviewsTable.userId,
      menuItemId: reviewsTable.menuItemId,
      rating: reviewsTable.rating,
      comment: reviewsTable.comment,
      createdAt: reviewsTable.createdAt,
      userName: usersTable.name,
      menuItemName: menuItemsTable.name,
    })
      .from(reviewsTable)
      .leftJoin(usersTable, eq(reviewsTable.userId, usersTable.id))
      .leftJoin(menuItemsTable, eq(reviewsTable.menuItemId, menuItemsTable.id))
      .where(menuItemId ? eq(reviewsTable.menuItemId, parseInt(menuItemId as string)) : undefined)
      .orderBy(desc(reviewsTable.createdAt));
    res.json(reviews);
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/reviews
router.post("/reviews", authenticate, async (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const { menuItemId, rating, comment } = req.body;
    if (!menuItemId || !rating) { res.status(400).json({ error: "menuItemId and rating are required" }); return; }
    if (rating < 1 || rating > 5) { res.status(400).json({ error: "Rating must be 1-5" }); return; }
    const [review] = await db.insert(reviewsTable).values({ userId: user.id, menuItemId, rating, comment }).returning();
    const [dbUser] = await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
    const [item] = await db.select({ name: menuItemsTable.name }).from(menuItemsTable).where(eq(menuItemsTable.id, menuItemId)).limit(1);
    res.status(201).json({ ...review, userName: dbUser?.name, menuItemName: item?.name });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
