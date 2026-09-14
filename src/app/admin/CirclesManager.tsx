"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import {
  ACTIVE_WITHIN_DAYS,
  QUIET_WITHIN_DAYS,
  type AdminCircleData,
  type AdminCircleRow,
} from "@/lib/circleActivity";
import { SPARK_WINDOW_HOURS } from "@/lib/circleSparks";
import { loadCircles } from "./circleActions";
import { JoinCircleModal } from "./JoinCircleModal";
import { SparkModal } from "./SparkModal";

const ACTIVITY_STYLES: Record<AdminCircleRow["activity"], { label: string; tone: string }> = {
  active: { label: "Active", tone: "bg-sage-soft text-sage" },
  quiet: { label: "Quiet", tone: "bg-surface2 text-muted" },
  silent: { label: "Silent", tone: "bg-warn-soft text-warn" },
};

function lastActivity(ts: string | null) {
  if (!ts) return "No posts yet";
  const days = Math.floor((Date.now() - new Date(ts).getTime()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(ts).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}

export function CirclesManager() {
  const [data, setData] = useState<AdminCircleData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState<AdminCircleRow | null>(null);
  const [sparking, setSparking] = useState<AdminCircleRow | null>(null);

  // Loaded from the client rather than passed down from the admin page, so
  // adding this tab needed no change to that page's own data fetching.
  const refresh = useCallback(async () => {
    const result = await loadCircles();
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setError(null);
    setData(result);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (error) {
    return <Card className="p-4 text-sm text-warn sm:p-4">{error}</Card>;
  }

  if (!data) {
    return <Card className="p-4 text-sm text-muted sm:p-4">Loading circles…</Card>;
  }

  const { circles, summary } = data;

  const cards = [
    { label: "Total circles", value: summary.totalCircles },
    { label: `Active (${ACTIVE_WITHIN_DAYS}d)`, value: summary.activeCircles },
    { label: `Quiet (8 to ${QUIET_WITHIN_DAYS}d)`, value: summary.quietCircles, warn: summary.quietCircles > 0 },
    { label: `Silent (${QUIET_WITHIN_DAYS}d plus)`, value: summary.silentCircles, warn: summary.silentCircles > 0 },
    { label: "Posts this week", value: summary.postsThisWeek },
    { label: "Total members", value: summary.totalMembers },
  ];

  return (
    <div className="space-y-6">
      <div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {cards.map((c) => (
            <Card key={c.label} className="text-center">
              <p className={`text-3xl font-semibold ${c.warn ? "text-warn" : "text-ink"}`}>{c.value}</p>
              <p className="mt-1 text-xs text-muted">{c.label}</p>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">
          Member and post figures are metadata only. No message content is read here. Seeded team accounts are counted
          separately from real members.
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-ink">Every circle</h3>
        <p className="mb-3 text-xs text-muted">Quietest first, so the circles that need a nudge are at the top.</p>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Circle</th>
                <th className="px-3 py-2 text-right font-medium">Members</th>
                <th className="px-3 py-2 text-right font-medium">Posts</th>
                <th className="px-3 py-2 text-right font-medium">Last activity</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {circles.length === 0 && (
                <tr>
                  <td className="px-3 py-4 text-muted" colSpan={6}>
                    No circles yet.
                  </td>
                </tr>
              )}
              {circles.map((c) => {
                const style = ACTIVITY_STYLES[c.activity];
                return (
                  <tr key={c.id} className="border-b border-border/50 align-middle last:border-0">
                    <td className="px-3 py-2">
                      <span className="text-ink">{c.label}</span>
                      <span className="ml-2 text-xs text-faint">{c.category}</span>
                      {c.hasLiveSpark && (
                        <span className="ml-2 rounded-full bg-sage-soft px-2 py-0.5 text-[10px] font-medium text-sage">
                          spark live
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-muted">
                      {c.members}
                      {c.seeded > 0 && <span className="ml-1 text-xs text-faint">plus {c.seeded} seeded</span>}
                    </td>
                    <td className="px-3 py-2 text-right text-muted">{c.posts}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-muted">{lastActivity(c.lastPostAt)}</td>
                    <td className="px-3 py-2">
                      <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${style.tone}`}>
                        {style.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      {/* Stacked rather than side by side: the admin page is
                          max-w-3xl, and two buttons on one line pushed this
                          table 80px wider than its container, which clipped
                          Send spark off the right edge. */}
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => setJoining(c)}
                          className="whitespace-nowrap rounded-xl border border-border bg-surface2 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface2/70"
                        >
                          Join as member
                        </button>
                        <button
                          type="button"
                          onClick={() => setSparking(c)}
                          className="whitespace-nowrap rounded-xl border border-sage/40 bg-sage-soft px-3 py-1.5 text-xs font-medium text-sage hover:bg-sage-soft/70"
                        >
                          Send spark
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted">
          Sparks are labelled as coming from Between Us and clear themselves after {SPARK_WINDOW_HOURS} hours. Seeded
          accounts look like ordinary members to everyone in the circle.
        </p>
      </div>

      {joining && (
        <JoinCircleModal circle={joining} onClose={() => setJoining(null)} onCreated={refresh} />
      )}
      {sparking && <SparkModal circle={sparking} onClose={() => setSparking(null)} onSent={refresh} />}
    </div>
  );
}
