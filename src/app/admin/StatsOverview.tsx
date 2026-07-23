import { Card } from "@/components/ui/Card";
import type { Stats } from "./types";

export function StatsOverview({ stats }: { stats: Stats }) {
  const items = [
    { label: "Total users", value: stats.totalUsers },
    { label: "Total circles", value: stats.totalCircles },
    { label: "Total posts", value: stats.totalPosts },
    { label: "Pending reports", value: stats.pendingReports },
    { label: "Resolved this week", value: stats.resolvedThisWeek },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((item) => (
        <Card key={item.label} className="text-center">
          <p className="text-3xl font-semibold text-ink">{item.value}</p>
          <p className="mt-1 text-xs text-muted">{item.label}</p>
        </Card>
      ))}
    </div>
  );
}
