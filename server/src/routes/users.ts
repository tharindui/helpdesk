import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Router } from "express";
import { requireAuth, requireAdmin } from "../middleware/requireAuth";
import prisma, { Role } from "../db";

// Separate auth instance with sign-up enabled — used only for admin user creation.
// The main auth instance has disableSignUp: true to block self-registration.
const adminAuth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL,
});

const router = Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/users
router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// POST /api/users
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, email, password, role = "agent" } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "")
    return void res.status(400).json({ error: "Name is required" });
  if (!email || !EMAIL_RE.test(email))
    return void res.status(400).json({ error: "Valid email is required" });
  if (!password || typeof password !== "string" || password.length < 8)
    return void res.status(400).json({ error: "Password must be at least 8 characters" });
  if (role !== "admin" && role !== "agent")
    return void res.status(400).json({ error: "Role must be admin or agent" });

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return void res.status(409).json({ error: "Email already in use" });

    const result = await adminAuth.api.signUpEmail({
      body: { name: name.trim(), email, password },
    });

    if (role === "admin") {
      await prisma.user.update({
        where: { id: result.user.id },
        data: { role: Role.admin },
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: result.user.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json(user);
  } catch {
    res.status(500).json({ error: "Failed to create user" });
  }
});

// PATCH /api/users/:id
router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = req.params.id as string;
  const { name, email, role } = req.body;
  const data: { name?: string; email?: string; role?: Role } = {};

  if (name !== undefined) {
    if (typeof name !== "string" || name.trim() === "")
      return void res.status(400).json({ error: "Name cannot be empty" });
    data.name = name.trim();
  }
  if (email !== undefined) {
    if (!EMAIL_RE.test(email))
      return void res.status(400).json({ error: "Valid email is required" });
    data.email = email;
  }
  if (role !== undefined) {
    if (role !== "admin" && role !== "agent")
      return void res.status(400).json({ error: "Role must be admin or agent" });
    data.role = role as Role;
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return void res.status(404).json({ error: "User not found" });

    if (data.email && data.email !== existing.email) {
      const taken = await prisma.user.findUnique({ where: { email: data.email } });
      if (taken) return void res.status(409).json({ error: "Email already in use" });
    }

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.json(updated);
  } catch {
    res.status(500).json({ error: "Failed to update user" });
  }
});

// DELETE /api/users/:id
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = req.params.id as string;

  if (req.user!.id === id)
    return void res.status(400).json({ error: "You cannot delete your own account" });

  try {
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return void res.status(404).json({ error: "User not found" });

    await prisma.user.delete({ where: { id } });
    res.status(204).end();
  } catch {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
