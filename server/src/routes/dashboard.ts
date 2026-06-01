import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import prisma from "../db";
import { SenderType, TicketStatus } from "@helpdesk/core";

const router = Router();

router.get("/", requireAuth, async (_req, res) => {
  const [
    total,
    open,
    aiResolved,
    byStatusRaw,
    byCategoryRaw,
    resolvedTickets,
    dailyVolumeRaw,
  ] = await Promise.all([
    prisma.ticket.count(),
    prisma.ticket.count({ where: { status: TicketStatus.open } }),
    prisma.ticket.count({
      where: {
        status: TicketStatus.resolved,
        replies: { some: { senderType: SenderType.ai } },
      },
    }),
    prisma.ticket.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.ticket.groupBy({
      by: ["category"],
      _count: { _all: true },
      where: { category: { not: null } },
    }),
    prisma.ticket.findMany({
      where: { status: { in: [TicketStatus.resolved, TicketStatus.closed] } },
      select: { createdAt: true, updatedAt: true },
    }),
    prisma.$queryRaw<{ date: Date; count: bigint }[]>`
      SELECT DATE("createdAt") AS date, COUNT(*) AS count
      FROM ticket
      WHERE "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `,
  ]);

  const avgResolutionMs =
    resolvedTickets.length === 0
      ? 0
      : resolvedTickets.reduce(
          (sum, t) => sum + (t.updatedAt.getTime() - t.createdAt.getTime()),
          0,
        ) / resolvedTickets.length;

  const EXCLUDE = new Set<string>([TicketStatus.new, TicketStatus.processing]);
  const byStatus = Object.fromEntries(
    byStatusRaw
      .filter((r) => !EXCLUDE.has(r.status))
      .map((r) => [r.status, r._count._all]),
  );

  const byCategory = Object.fromEntries(
    byCategoryRaw
      .filter((r) => r.category)
      .map((r) => [r.category!, r._count._all]),
  );

  const dailyVolume = dailyVolumeRaw.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    count: Number(r.count),
  }));

  res.json({
    total,
    open,
    aiResolved,
    aiResolvedPercent:
      total === 0 ? 0 : Math.round((aiResolved / total) * 100 * 10) / 10,
    avgResolutionMs: Math.round(avgResolutionMs),
    byStatus,
    byCategory,
    dailyVolume,
  });
});

export default router;
