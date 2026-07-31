"use client";

import { StageDot } from "./StageDot";
import type { Post } from "./types";

type Member = {
  id: string;
  username: string;
  current_stage: string;
  created_at: string;
};

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

function BackArrowIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M19 12H5" />
      <path d="M11 18l-6-6 6-6" />
    </svg>
  );
}

// A member's activity is judged against their most recent post, or
// their join date if they have never posted, kept deliberately coarse
// (day / week / month) rather than exact so it stays warm, not a
// surveillance readout. Someone who has never posted always reads as
// "joined recently" rather than borrowing the "active" language, since
// that is a gentler way to describe a quiet, lurking member.
function activityLabel(lastPostAt: string | null): string {
  if (!lastPostAt) return "Joined recently";
  const days = Math.floor((Date.now() - new Date(lastPostAt).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 1) return "Active today";
  if (days < 7) return "Active this week";
  return "Active this month";
}

export function MembersPanel({
  members,
  posts,
  currentUserId,
  circleDisplayName,
  onClose,
}: {
  members: Member[];
  posts: Post[];
  currentUserId: string;
  circleDisplayName: string;
  onClose: () => void;
}) {
  const lastPostByUser = new Map<string, string>();
  for (const post of posts) {
    const existing = lastPostByUser.get(post.user_id);
    if (!existing || new Date(post.created_at) > new Date(existing)) {
      lastPostByUser.set(post.user_id, post.created_at);
    }
  }

  const sorted = [...members].sort((a, b) => {
    if (a.id === currentUserId) return -1;
    if (b.id === currentUserId) return 1;
    return a.username.localeCompare(b.username);
  });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          aria-label="Back to feed"
          className="text-muted hover:text-ink md:hidden"
        >
          <BackArrowIcon />
        </button>
        <div className="flex-1">
          <h2 className="text-sm font-semibold text-ink">Your Circle</h2>
          <p className="text-xs text-muted">
            {members.length} {members.length === 1 ? "member" : "members"} · {circleDisplayName}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close members panel"
          className="hidden text-muted hover:text-ink md:block"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-1">
          {sorted.map((member) => {
            const isYou = member.id === currentUserId;
            return (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-xl px-2 py-2.5"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <StageDot stage={member.current_stage} />
                  <span className="truncate text-sm text-ink">
                    {member.username}
                    {isYou && <span className="text-muted"> (you)</span>}
                  </span>
                </div>
                <span className="shrink-0 text-xs text-faint">
                  {activityLabel(lastPostByUser.get(member.id) ?? null)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <p className="text-center text-xs text-faint">
          All members are anonymous. Names are chosen by each person.
        </p>
      </div>
    </div>
  );
}
