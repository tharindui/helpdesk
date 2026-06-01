import api from "@/lib/axios";

export type DashboardStats = {
  total: number;
  open: number;
  aiResolved: number;
  aiResolvedPercent: number;
  avgResolutionMs: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
  dailyVolume: { date: string; count: number }[];
};

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>("/api/dashboard").then((r) => r.data),
};
