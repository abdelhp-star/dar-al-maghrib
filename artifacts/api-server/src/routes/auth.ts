import { Router } from "express";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, signToken, type JwtPayload } from "../middlewares/auth";

const router = Router();

// POST /api/auth/register
router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email and password are required" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({ name, email, passwordHash, phone }).returning();
    const payload: JwtPayload = { id: user.id, email: user.email, role: user.role };
    const token = signToken(payload);
    res.status(201).json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/auth/login
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const payload: JwtPayload = { id: user.id, email: user.email, role: user.role };
    const token = signToken(payload);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role, createdAt: user.createdAt },
    });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/auth/me
router.get("/auth/me", authenticate, async (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const [dbUser] = await db.select().from(usersTable).where(eq(usersTable.id, user.id)).limit(1);
    if (!dbUser) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({ id: dbUser.id, name: dbUser.name, email: dbUser.email, phone: dbUser.phone, address: dbUser.address, role: dbUser.role, createdAt: dbUser.createdAt });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/auth/me/profile
router.patch("/auth/me/profile", authenticate, async (req, res) => {
  try {
    const user = (req as any).user as JwtPayload;
    const { name, phone, address } = req.body;
    const [dbUser] = await db.update(usersTable)
      .set({ ...(name && { name }), ...(phone !== undefined && { phone }), ...(address !== undefined && { address }) })
      .where(eq(usersTable.id, user.id))
      .returning();
    res.json({ id: dbUser.id, name: dbUser.name, email: dbUser.email, phone: dbUser.phone, address: dbUser.address, role: dbUser.role, createdAt: dbUser.createdAt });
  } catch (err) {
    req.log.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
