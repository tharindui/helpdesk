import { Router } from "express";
import { z } from "zod";
import { TicketStatus, TicketCategory, SenderType, createReplySchema } from "@helpdesk/core";
import { validateBody } from "../middleware/validateBody";
import { requireAuth } from "../middleware/requireAuth";
import prisma from "../db";
import { polishReply, summarizeTicket } from "../services/ai";

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

const querySchema = z.object({
  sortBy: z.enum(SORTABLE_FIELDS).optional().default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
  status: z.nativeEnum(TicketStatus).optional(),
  category: z.nativeEnum(TicketCategory).optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(10),
});

router.get("/", requireAuth, async (req, res) => {
  const result = querySchema.safeParse(req.query);
  const { sortBy, sortDir, status, category, search, page, pageSize } = result.success
    ? result.data
    : { sortBy: "createdAt" as const, sortDir: "desc" as const, status: undefined, category: undefined, search: undefined, page: 1, pageSize: 10 };

  const where = {
    ...(status !== undefined && { status }),
    ...(category !== undefined && { category }),
    ...(search && {
      OR: [
        { subject: { contains: search, mode: "insensitive" as const } },
        { fromName: { contains: search, mode: "insensitive" as const } },
        { fromEmail: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [data, total] = await prisma.$transaction([
    prisma.ticket.findMany({
      where,
      orderBy: { [sortBy]: sortDir },
      select: ticketSelect,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.ticket.count({ where }),
  ]);

  res.json({ data, total, page, pageSize });
});

router.get("/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { ...ticketSelect, body: true, bodyHTML: true, assignedTo: { select: { id: true, name: true } } },
  });

  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  res.json(ticket);
});

const patchSchema = z.object({
  assignedToId: z.string().min(1).nullable().optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  category: z.nativeEnum(TicketCategory).nullable().optional(),
});

router.patch("/:id", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const result = patchSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.flatten().fieldErrors });
    return;
  }

  const { assignedToId, status, category } = result.data;

  if (assignedToId !== undefined && assignedToId !== null) {
    const user = await prisma.user.findFirst({ where: { id: assignedToId, deletedAt: null } });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
  }

  const existing = await prisma.ticket.findUnique({ where: { id }, select: { id: true } });
  if (!existing) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      ...(assignedToId !== undefined && { assignedToId }),
      ...(status !== undefined && { status }),
      ...(category !== undefined && { category }),
    },
    select: { ...ticketSelect, body: true, bodyHTML: true, assignedTo: { select: { id: true, name: true } } },
  });

  res.json(ticket);
});

const replySelect = {
  id: true,
  body: true,
  bodyHTML: true,
  senderType: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
} as const;

router.get("/:id/replies", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id }, select: { id: true } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const replies = await prisma.reply.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: "asc" },
    select: replySelect,
  });

  res.json(replies);
});

router.post("/:id/replies", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const result = createReplySchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.flatten().fieldErrors });
    return;
  }

  const ticket = await prisma.ticket.findUnique({ where: { id }, select: { id: true } });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const reply = await prisma.reply.create({
    data: {
      ticketId: id,
      authorId: req.user!.id,
      senderType: SenderType.agent,
      body: result.data.body,
    },
    select: replySelect,
  });

  res.status(201).json(reply);
});

router.post("/:id/summarize", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { subject: true, body: true },
  });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const replies = await prisma.reply.findMany({
    where: { ticketId: id },
    orderBy: { createdAt: "asc" },
    select: { body: true, senderType: true, author: { select: { name: true } } },
  });

  const summary = await summarizeTicket(ticket.subject, ticket.body, replies);
  res.json({ summary });
});

router.post("/:id/polish-reply", requireAuth, async (req, res) => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid ticket ID" });
    return;
  }

  const result = z.object({ body: z.string().trim().min(1) }).safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ errors: result.error.flatten().fieldErrors });
    return;
  }

  const ticket = await prisma.ticket.findUnique({
    where: { id },
    select: { subject: true, body: true, fromName: true },
  });
  if (!ticket) {
    res.status(404).json({ error: "Ticket not found" });
    return;
  }

  const options = await polishReply(result.data.body, req.user!.name, ticket.subject, ticket.body, ticket.fromName);
  res.json(options);
});

const inboundEmailSchema = z.object({
  from: z.string().email("Invalid sender email").max(254, "Email too long"),
  fromName: z.string().trim().min(1, "Sender name is required").max(100, "Sender name too long"),
  subject: z.string().trim().min(1, "Subject is required").max(255, "Subject too long"),
  body: z.string().trim().min(1, "Body is required").max(100_000, "Body too long"),
  bodyHTML: z.string().max(100_000, "Body HTML too long").optional(),
});

// POST /api/tickets/inbound — public webhook, secured by X-Webhook-Secret header
router.post("/inbound", async (req, res) => {
  if (req.headers["x-webhook-secret"] !== process.env.WEBHOOK_SECRET) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  const { from, fromName, subject, body, bodyHTML } = validateBody(inboundEmailSchema, req.body);

  const existing = await prisma.ticket.findFirst({
    where: { fromEmail: from, subject, body },
    select: ticketSelect,
  });
  if (existing) return void res.status(409).json({ error: "Ticket already exists", ticket: existing });

  const ticket = await prisma.ticket.create({
    data: { fromEmail: from, fromName, subject, body, ...(bodyHTML && { bodyHTML }) },
    select: ticketSelect,
  });

  res.status(201).json(ticket);
});

export default router;
