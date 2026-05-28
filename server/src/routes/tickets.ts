import { Router } from "express";
import { z } from "zod";
import { validateBody } from "../middleware/validateBody";
import { requireAuth } from "../middleware/requireAuth";
import prisma from "../db";

if (!process.env.WEBHOOK_SECRET) throw new Error("WEBHOOK_SECRET must be set");

const router = Router();

const ticketSelect = {
  id: true,
  fromEmail: true,
  fromName: true,
  subject: true,
  status: true,
  category: true,
  createdAt: true,
} as const;

const SORTABLE_FIELDS = [
  "subject",
  "fromName",
  "fromEmail",
  "status",
  "category",
  "createdAt",
] as const;

const sortQuerySchema = z.object({
  sortBy: z.enum(SORTABLE_FIELDS).optional().default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
});

router.get("/", requireAuth, async (req, res) => {
  const result = sortQuerySchema.safeParse(req.query);
  const { sortBy, sortDir } = result.success
    ? result.data
    : { sortBy: "createdAt" as const, sortDir: "desc" as const };

  const tickets = await prisma.ticket.findMany({
    orderBy: { [sortBy]: sortDir },
    select: ticketSelect,
  });
  res.json(tickets);
});

const inboundEmailSchema = z.object({
  from: z.string().email("Invalid sender email"),
  fromName: z.string().trim().min(1, "Sender name is required"),
  subject: z.string().trim().min(1, "Subject is required"),
  body: z.string().trim().min(1, "Body is required"),
});

// POST /api/tickets/inbound — public webhook, secured by X-Webhook-Secret header
router.post("/inbound", async (req, res) => {
  if (req.headers["x-webhook-secret"] !== process.env.WEBHOOK_SECRET) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { from, fromName, subject, body } = validateBody(inboundEmailSchema, req.body);

  const existing = await prisma.ticket.findFirst({
    where: { fromEmail: from, subject, body },
    select: ticketSelect,
  });
  if (existing) return void res.status(409).json({ error: "Ticket already exists", ticket: existing });

  const ticket = await prisma.ticket.create({
    data: { fromEmail: from, fromName, subject, body },
    select: ticketSelect,
  });

  res.status(201).json(ticket);
});

export default router;
