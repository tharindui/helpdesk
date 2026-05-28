import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Router } from "express";
import { createUserSchema, editUserSchema } from "@helpdesk/core";
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

// PATCH accepts partial updates; derive from the shared edit schema.
const updateUserSchema = editUserSchema.partial();

// GET /api/users
router.get("/", requireAuth, requireAdmin, async (_req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(users);
});

// POST /api/users
router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const result = createUserSchema.safeParse(req.body);
  if (!result.success)
    return void res.status(400).json({ errors: result.error.flatten().fieldErrors });

  const { name, email, password, role = "agent" } = result.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return void res.status(409).json({ error: "Email already in use" });

  const created = await adminAuth.api.signUpEmail({
    body: { name, email, password },
  });

  if (role === "admin") {
    await prisma.user.update({
      where: { id: created.user.id },
      data: { role: Role.admin },
    });
  }

  const user = await prisma.user.findUnique({
    where: { id: created.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  res.status(201).json(user);
});

// PATCH /api/users/:id
router.patch("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = req.params.id as string;

  const result = updateUserSchema.safeParse(req.body);
  if (!result.success)
    return void res.status(400).json({ errors: result.error.flatten().fieldErrors });

  const data: { name?: string; email?: string; role?: Role } = {
    ...result.data,
    role: result.data.role as Role | undefined,
  };

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
});

// DELETE /api/users/:id
router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = req.params.id as string;

  if (req.user!.id === id)
    return void res.status(400).json({ error: "You cannot delete your own account" });

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return void res.status(404).json({ error: "User not found" });

  await prisma.user.delete({ where: { id } });
  res.status(204).end();
});

export default router;
