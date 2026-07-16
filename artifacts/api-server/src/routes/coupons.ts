import { Router } from "express";
import { db, couponsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middlewares/auth";

const router = Router();

function formatCoupon(c: any) {
  return {
    ...c,
    discountValue: parseFloat(c.discountValue),
    minOrderAmount: c.minOrderAmount ? parseFloat(c.minOrderAmount) : null,
  };
}

// POST /api/coupons/validate
router.post("/coupons/validate", async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    if (!code) { res.status(400).json({ error: "Code is required" }); return; }
    const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code.toUpperCase())).limit(1);
    if (!coupon || !coupon.active) {
      res.status(400).json({ error: "Invalid or expired coupon" });
      return;
    }
    if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
      res.status(400).json({ error: "Coupon has expired" });
      return;
    }
    if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
      res.status(400).json({ error: "Coupon usage limit reached" });
      return;
    }
    if (coupon.minOrderAmount && orderAmount < parseFloat(coupon.minOrderAmount as any)) {
      res.status(400).json({ error: `Minimum order amount is ${coupon.minOrderAmount}` });
      return;
    }
    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.round(orderAmount * parseFloat(coupon.discountValue as any) / 100 * 100) / 100;
    } else {
      discount = Math.min(parseFloat(coupon.discountValue as any), orderAmount);
    }
    res.json({ valid: true, discount, coupon: formatCoupon(coupon), message: `Coupon applied! You save ${discount}` });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/coupons (admin)
router.get("/coupons", authenticate, requireAdmin, async (req, res) => {
  try {
    const coupons = await db.select().from(couponsTable);
    res.json(coupons.map(formatCoupon));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/coupons (admin)
router.post("/coupons", authenticate, requireAdmin, async (req, res) => {
  try {
    const { code, description, discountType, discountValue, minOrderAmount, maxUses, active, expiresAt } = req.body;
    const [c] = await db.insert(couponsTable).values({
      code: code.toUpperCase(), description, discountType, discountValue: discountValue.toString(),
      minOrderAmount: minOrderAmount?.toString(), maxUses, active: active ?? true, expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    }).returning();
    res.status(201).json(formatCoupon(c));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/coupons/:id (admin)
router.patch("/coupons/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    const body = req.body;
    const updateData: any = {};
    if (body.code !== undefined) updateData.code = body.code.toUpperCase();
    if (body.description !== undefined) updateData.description = body.description;
    if (body.discountType !== undefined) updateData.discountType = body.discountType;
    if (body.discountValue !== undefined) updateData.discountValue = body.discountValue.toString();
    if (body.minOrderAmount !== undefined) updateData.minOrderAmount = body.minOrderAmount?.toString();
    if (body.maxUses !== undefined) updateData.maxUses = body.maxUses;
    if (body.active !== undefined) updateData.active = body.active;
    if (body.expiresAt !== undefined) updateData.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    const [c] = await db.update(couponsTable).set(updateData).where(eq(couponsTable.id, id)).returning();
    if (!c) { res.status(404).json({ error: "Not found" }); return; }
    res.json(formatCoupon(c));
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// DELETE /api/coupons/:id (admin)
router.delete("/coupons/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(String(req.params.id));
    await db.delete(couponsTable).where(eq(couponsTable.id, id));
    res.status(204).send();
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
