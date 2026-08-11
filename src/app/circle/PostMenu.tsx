"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { REPORT_REASONS } from "@/lib/reportReasons";
import { notifyReportSubmitted } from "./actions";
import { usePopoverPosition, useOutsideClose } from "./usePopover";

type PostMenuProps = {
  postId: string;
  isOwnPost: boolean;
  replyCount: number;
  onDeleted: () => void;
  onEdit?: () => void;
};

type Mode = "menu" | "confirmDelete" | "reportReasons" | "reportSent" | "reportFailed" | "deleting";

export function PostMenu({ postId, isOwnPost, replyCount, onDeleted, onEdit }: PostMenuProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const triggerRef = useRef<HTMLDivElement>(null);

  const { ref: panelRef, style: panelStyle } = usePopoverPosition(triggerRef, open);

  function close() {
    setOpen(false);
    setMode("menu");
  }

  useOutsideClose([triggerRef, panelRef], close, open);

  async function handleDelete() {
    setMode("deleting");
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      setMode("menu");
      return;
    }
    onDeleted();
  }

  function handleEditClick() {
    close();
    onEdit?.();
  }

  async function handleReport(reason: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: report, error } = await supabase
      .from("reports")
      .insert({
        post_id: postId,
        reported_by: user.id,
        reason,
      })
      .select("id")
      .single();

    // Previously always showed the "thanks" confirmation regardless of
    // whether the insert actually succeeded, so a failed report silently
    // looked successful to the reporter.
    if (error || !report) {
      setMode("reportFailed");
      return;
    }
    void notifyReportSubmitted(report.id);
    setMode("reportSent");
    setTimeout(close, 1500);
  }

  return (
    <div ref={triggerRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Post options"
        className="rounded-full px-2 py-1 text-muted hover:bg-surface2 hover:text-ink"
      >
        ⋯
      </button>

      {open && (
        <div
          ref={panelRef}
          style={panelStyle}
          className="z-40 w-56 rounded-xl border border-border bg-surface2 p-2 shadow-lg shadow-black/30"
        >
          {mode === "menu" && (
            <div className="flex flex-col">
              {!isOwnPost && (
                <button
                  type="button"
                  onClick={() => setMode("reportReasons")}
                  className="rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface"
                >
                  Report this post
                </button>
              )}
              {isOwnPost && onEdit && (
                <button
                  type="button"
                  onClick={handleEditClick}
                  className="rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface"
                >
                  Edit post
                </button>
              )}
              {isOwnPost && (
                <button
                  type="button"
                  onClick={() => setMode("confirmDelete")}
                  className="rounded-lg px-3 py-2 text-left text-sm text-warn hover:bg-surface"
                >
                  Delete post
                </button>
              )}
            </div>
          )}

          {mode === "confirmDelete" && (
            <div className="flex flex-col gap-2 p-1">
              <p className="text-sm text-ink">
                {replyCount > 0
                  ? `Delete this post and its ${replyCount} ${replyCount === 1 ? "reply" : "replies"}? This can't be undone.`
                  : "Delete this post? This can't be undone."}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMode("menu")}
                  className="flex-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-surface"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex-1 rounded-lg bg-warn px-3 py-1.5 text-xs text-bg hover:opacity-90"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {mode === "deleting" && (
            <p className="p-2 text-sm text-muted">Deleting…</p>
          )}

          {mode === "reportReasons" && (
            <div className="flex flex-col gap-1 p-1">
              <p className="px-2 pb-1 text-xs text-faint">Why are you reporting this?</p>
              {REPORT_REASONS.map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => handleReport(reason)}
                  className="rounded-lg px-3 py-2 text-left text-sm text-ink hover:bg-surface"
                >
                  {reason}
                </button>
              ))}
            </div>
          )}

          {mode === "reportSent" && (
            <p className="p-3 text-center text-sm text-muted">
              Thanks, we&apos;ll take a look.
            </p>
          )}

          {mode === "reportFailed" && (
            <div className="flex flex-col gap-2 p-2">
              <p className="text-center text-sm text-warn">
                Something went wrong. Please try again.
              </p>
              <button
                type="button"
                onClick={() => setMode("reportReasons")}
                className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-surface"
              >
                Back
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
