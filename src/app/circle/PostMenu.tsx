"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { REPORT_REASONS } from "@/lib/reportReasons";

type PostMenuProps = {
  postId: string;
  isOwnPost: boolean;
  replyCount: number;
  onDeleted: () => void;
};

type Mode = "menu" | "confirmDelete" | "reportReasons" | "reportSent" | "deleting";

export function PostMenu({ postId, isOwnPost, replyCount, onDeleted }: PostMenuProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("menu");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setMode("menu");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleDelete() {
    setMode("deleting");
    const { error } = await supabase.from("posts").delete().eq("id", postId);
    if (error) {
      setMode("menu");
      return;
    }
    onDeleted();
  }

  async function handleReport(reason: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("reports").insert({
      post_id: postId,
      reported_by: user.id,
      reason,
    });
    setMode("reportSent");
    setTimeout(() => {
      setOpen(false);
      setMode("menu");
    }, 1500);
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Post options"
        className="rounded-full px-2 py-1 text-muted hover:bg-surface2 hover:text-ink"
      >
        ⋯
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-xl border border-border bg-surface2 p-2 shadow-lg shadow-black/30">
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
              Thanks — we&apos;ll take a look.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
