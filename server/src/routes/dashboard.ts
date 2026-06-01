import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import prisma from "../db";

const router = Router();

type StatsRow = {
  total: number;
  open: number;
  aiResolved: number;
  avgResolutionMs: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  dailyVolume: { date: string; count: number }[];
};

router.get("/", requireAuth, async (_req, res) => {
  const [row] = await prisma.$queryRaw<[{ get_dashboard_stats: StatsRow }]>`
    SELECT get_dashboard_stats()
  `;

  const stats = row.get_dashboard_stats;
  const aiResolvedPercent =
    stats.total === 0
      ? 0
      : Math.round((stats.aiResolved / stats.total) * 100 * 10) / 10;

  res.json({ ...stats, aiResolvedPercent });
});

export default router;
