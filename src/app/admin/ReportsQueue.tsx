"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { timeAgo } from "@/lib/time";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { PendingReport } from "./types";

export function ReportsQueue({
  initialReports,
  onCountChange,
}: {
  initialReports: PendingReport[];
  onCountChange?: (count: number) => void;
}) {
  const supabase = createClient();
  const [reports, setReports] = useState(initialReports);
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  useEffect(() => {
    onCountChange?.(reports.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reports.length]);

  async function handleRemovePost(report: PendingReport) {
    if (!report.post) return;
    setPendingAction(report.id);

    const { error: postError } = await supabase
      .from("posts")
      .update({ is_removed: true })
      .eq("id", report.post.id);

    if (!postError) {
      await supabase.from("reports").update({ status: "resolved_removed" }).eq("id", report.id);
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    }
    setPendingAction(null);
  }

  async function handleIgnore(report: PendingReport) {
    setPendingAction(report.id);

    const { error } = await supabase
      .from("reports")
      .update({ status: "resolved_kept" })
      .eq("id", report.id);

    if (!error) {
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    }
    setPendingAction(null);
  }

  if (reports.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
        No pending reports. Everything&apos;s calm.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {reports.map((report) => (
        <Card key={report.id}>
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
            <span>
              Reported by <span className="text-ink">{report.reporter?.username ?? "someone"}</span>
              {" · "}
              {timeAgo(report.created_at)}
            </span>
            <span className="rounded-full bg-warn-soft px-2 py-0.5 text-warn">{report.reason}</span>
          </div>

          <p className="mt-3 text-xs text-faint">
            Post by <span className="text-muted">{report.post?.users?.username ?? "someone"}</span>
          </p>
          <p className="mt-1 whitespace-pre-wrap rounded-xl bg-surface2 p-3 text-sm text-ink">
            {report.post?.content ?? "This post has since been deleted."}
          </p>

          <div className="mt-4 flex gap-2">
            <Button
              variant="secondary"
              onClick={() => handleIgnore(report)}
              disabled={pendingAction === report.id}
            >
              Ignore
            </Button>
            <Button
              variant="danger"
              onClick={() => handleRemovePost(report)}
              disabled={pendingAction === report.id || !report.post}
            >
              Remove Post
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
