"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type BlockedMember = { blockedId: string; username: string };

// Blocks can be made from the iOS app; this is where they are undone on the
// web. RLS only lets a member see and delete their own blocks, and unblocking
// brings that person's posts back on the next load of the circle.
export function BlockedMembers({
  userId,
  initialMembers,
}: {
  userId: string;
  initialMembers: BlockedMember[];
}) {
  const supabase = createClient();
  const [members, setMembers] = useState(initialMembers);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUnblock(blockedId: string) {
    setPendingId(blockedId);
    setError(null);
    const { error: deleteError } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", userId)
      .eq("blocked_id", blockedId);
    setPendingId(null);

    if (deleteError) {
      setError("That didn't work. Please try again.");
      return;
    }
    setMembers((prev) => prev.filter((m) => m.blockedId !== blockedId));
  }

  return (
    <div>
      <p className="text-sm font-medium text-muted">Blocked members</p>
      <p className="mt-1 text-xs leading-relaxed text-faint">
        You don&apos;t see posts from people you block. They are never told.
      </p>

      {members.length === 0 ? (
        <p className="mt-2 text-sm text-muted">You haven&apos;t blocked anyone.</p>
      ) : (
        <ul className="mt-2 flex flex-col divide-y divide-border">
          {members.map((m) => (
            <li key={m.blockedId} className="flex items-center justify-between py-2">
              <span className="text-sm text-ink">{m.username}</span>
              <button
                type="button"
                onClick={() => handleUnblock(m.blockedId)}
                disabled={pendingId === m.blockedId}
                aria-label={`Unblock ${m.username}`}
                className="rounded-lg border border-border px-3 py-1 text-xs text-muted hover:bg-surface2 hover:text-ink disabled:opacity-50"
              >
                {pendingId === m.blockedId ? "Unblocking…" : "Unblock"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="mt-1 text-xs text-warn">{error}</p>}
    </div>
  );
}
