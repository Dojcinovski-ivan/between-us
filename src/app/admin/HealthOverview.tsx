import { Card } from "@/components/ui/Card";
import type { CircleHealth, CircleHealthRow, ErrorLogRow } from "@/lib/circleHealth";

const SOURCE_LABELS: Record<string, string> = {
  post_create: "Failed to post",
  realtime: "Realtime dropped",
  client: "Client error",
};

const SILENT_AFTER_DAYS = 7;

function humanCategory(slug: string) {
  return slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function relTime(ts: string | null) {
  if (!ts) return "never";
  const mins = (Date.now() - new Date(ts).getTime()) / 60000;
  if (mins < 60) return `${Math.round(mins)}m ago`;
  const hrs = mins / 60;
  if (hrs < 24) return `${Math.round(hrs)}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function rowState(c: CircleHealthRow): { label: string; tone: string } | null {
  if (c.members > 0 && c.posts === 0) return { label: "dead", tone: "text-warn" };
  if (c.posts > 0 && c.lastPostAt && (Date.now() - new Date(c.lastPostAt).getTime()) / 86_400_000 > SILENT_AFTER_DAYS)
    return { label: "silent", tone: "text-warn" };
  if (c.members === 0) return { label: "empty", tone: "text-muted" };
  return null;
}

export function HealthOverview({ health, errors }: { health: CircleHealth; errors: ErrorLogRow[] }) {
  const { circles, summary } = health;

  const cards = [
    { label: "Active circles", value: summary.totalCircles },
    { label: "Members", value: summary.totalMembers },
    { label: "Posts", value: summary.totalPosts },
    { label: "Dead circles", value: summary.deadCircles, warn: summary.deadCircles > 0 },
    { label: "Silent circles", value: summary.silentCircles, warn: summary.silentCircles > 0 },
    { label: "Never posted", value: summary.membersNeverPosted },
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
          All figures are metadata only — post counts, timestamps and membership. No message content is read here.
        </p>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-ink">Per circle</h3>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border text-xs text-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Circle</th>
                <th className="px-3 py-2 text-right font-medium">Members</th>
                <th className="px-3 py-2 text-right font-medium">Posts</th>
                <th className="px-3 py-2 text-right font-medium">Posters</th>
                <th className="px-3 py-2 text-right font-medium">Replies</th>
                <th className="px-3 py-2 text-right font-medium">Last activity</th>
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
                const state = rowState(c);
                return (
                  <tr key={c.id} className="border-b border-border/50 last:border-0">
                    <td className="px-3 py-2 text-ink">
                      {humanCategory(c.category)}
                      {state && <span className={`ml-2 text-xs ${state.tone}`}>· {state.label}</span>}
                    </td>
                    <td className="px-3 py-2 text-right text-muted">{c.members}</td>
                    <td className="px-3 py-2 text-right text-muted">{c.posts}</td>
                    <td className="px-3 py-2 text-right text-muted">{c.posters}</td>
                    <td className="px-3 py-2 text-right text-muted">{c.replies}</td>
                    <td className="px-3 py-2 text-right text-muted">{relTime(c.lastPostAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-ink">Joining &amp; onboarding</h3>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Joined (14d)", value: summary.recentJoiners },
            { label: "New, not posted", value: summary.recentJoinersNeverPosted },
            { label: "No circle", value: summary.usersWithNoCircle, warn: summary.usersWithNoCircle > 0 },
            { label: "Orphan posts", value: summary.orphanPosts, warn: summary.orphanPosts > 0 },
          ].map((c) => (
            <Card key={c.label} className="p-4 text-center sm:p-4">
              <p className={`text-2xl font-semibold ${c.warn ? "text-warn" : "text-ink"}`}>{c.value}</p>
              <p className="mt-1 text-xs text-muted">{c.label}</p>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-ink">Recent failures</h3>
        {errors.length === 0 ? (
          <Card className="p-4 text-sm text-muted sm:p-4">
            No send or realtime failures logged. This is where a post that failed to save, or a member&apos;s realtime
            connection dropping, would show up.
          </Card>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border text-xs text-muted">
                <tr>
                  <th className="px-3 py-2 font-medium">When</th>
                  <th className="px-3 py-2 font-medium">What</th>
                  <th className="px-3 py-2 font-medium">Detail</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((e) => (
                  <tr key={e.id} className="border-b border-border/50 last:border-0 align-top">
                    <td className="whitespace-nowrap px-3 py-2 text-muted">{relTime(e.created_at)}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-warn">{SOURCE_LABELS[e.source] ?? e.source}</td>
                    <td className="px-3 py-2 text-muted">
                      <span className="text-ink">{e.message}</span>
                      {e.context?.circle_id && (
                        <span className="ml-2 text-xs text-faint">circle {e.context.circle_id.slice(0, 8)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-muted">
        Failures are captured as metadata only — an error message and where it happened, never the message a member was
        trying to send.
      </p>
    </div>
  );
}
