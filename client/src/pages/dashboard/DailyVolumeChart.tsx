import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Props = { dailyVolume: { date: string; count: number }[] };

function fillGaps(data: { date: string; count: number }[]): { date: string; count: number }[] {
  const map = new Map(data.map((d) => [d.date, d.count]));
  const now = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (29 - i));
    const key = d.toISOString().slice(0, 10);
    return { date: key, count: map.get(key) ?? 0 };
  });
}

function shortDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function DailyVolumeChart({ dailyVolume }: Props) {
  const data = fillGaps(dailyVolume);
  const ticks = data.filter((_, i) => i % 5 === 0).map((d) => d.date);

  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: 0, right: 8 }}>
        <defs>
          <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          ticks={ticks}
          tickFormatter={shortDate}
          tick={{ fontSize: 11 }}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={28} />
        <Tooltip
          labelFormatter={(label) => shortDate(String(label))}
          formatter={(value) => [value, "Tickets"]}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="#3b82f6"
          strokeWidth={2}
          fill="url(#volumeGradient)"
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
