import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
};

export function StatsCard({ label, value, sub, icon: Icon }: Props) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 pt-5 pb-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <div className="rounded-md bg-primary/12 p-1.5 text-primary">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div>
          <p className="text-3xl font-bold text-foreground">{value}</p>
          {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
