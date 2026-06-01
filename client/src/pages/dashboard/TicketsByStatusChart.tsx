import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS: Record<string, string> = {
  open: "var(--chart-1)",
  resolved: "var(--chart-3)",
  closed: "var(--chart-4)",
  new: "var(--chart-2)",
  processing: "var(--chart-5)",
};

type Props = { byStatus: Record<string, number> };

export function TicketsByStatusChart({ byStatus }: Props) {
  const data = Object.entries(byStatus).map(([name, value]) => ({ name, value }));

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name] ?? "#94a3b8"} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [value, "Tickets"]} />
        <Legend
          formatter={(value) => value.charAt(0).toUpperCase() + value.slice(1)}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
