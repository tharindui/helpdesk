import { Ticket, CircleDot, Bot, Clock, BarChart2 } from "lucide-react";
import { authClient } from "../lib/auth-client";
import { useDashboard } from "./dashboard/useDashboard";
import { DashboardSkeleton } from "./dashboard/DashboardSkeleton";
import { StatsCard } from "./dashboard/StatsCard";
import { TicketsByStatusChart } from "./dashboard/TicketsByStatusChart";
import { TicketsByCategoryChart } from "./dashboard/TicketsByCategoryChart";
import { DailyVolumeChart } from "./dashboard/DailyVolumeChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function formatDuration(ms: number): string {
  if (ms === 0) return "—";
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours < 24) return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function HomePage() {
  const { data: session } = authClient.useSession();
  const { data, isLoading, isError } = useDashboard();

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !data) {
    return (
      <p className="text-sm text-muted-foreground">Failed to load dashboard.</p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">
          Welcome back, {session?.user.name ?? "Agent"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's an overview of your helpdesk activity.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatsCard label="Total Tickets" value={data.total} icon={Ticket} />
        <StatsCard label="Open Tickets" value={data.open} icon={CircleDot} />
        <StatsCard
          label="Resolved by AI"
          value={data.aiResolved}
          icon={Bot}
        />
        <StatsCard
          label="AI Resolution Rate"
          value={`${data.aiResolvedPercent}%`}
          sub="of all tickets"
          icon={BarChart2}
        />
        <StatsCard
          label="Avg Resolution Time"
          value={formatDuration(data.avgResolutionMs)}
          icon={Clock}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tickets by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TicketsByStatusChart byStatus={data.byStatus} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tickets by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TicketsByCategoryChart byCategory={data.byCategory} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Daily Ticket Volume (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <DailyVolumeChart dailyVolume={data.dailyVolume} />
        </CardContent>
      </Card>
    </div>
  );
}
