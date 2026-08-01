"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";

const MAX_LENGTH = 1000;

type Draft = { id: string; content: string } | null;

export function WaitingRoom({
  circleId,
  circleDisplayName,
  userId,
  initialDraft,
}: {
  circleId: string;
  circleDisplayName: string;
  userId: string;
  initialDraft: Draft;
}) {
  const supabase = createClient();
  const router = useRouter();

  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [isEditing, setIsEditing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The moment a second member joins, the draft (if any) has already
  // been published server side by matchCircle. This just needs to know
  // to leave the waiting room, which a full page data refresh handles
  // naturally, the server component re-renders the normal feed since
  // member_count is now 2 or more.
  useEffect(() => {
    const channel = supabase
      .channel(`circle-waiting-${circleId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "circles",
          filter: `id=eq.${circleId}`,
        },
        (payload) => {
          const updated = payload.new as { member_count: number };
          if (updated.member_count >= 2) {
            router.refresh();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [circleId]);

  async function handleSave() {
    const trimmed = content.trim();
    if (!trimmed) return;
    setIsSubmitting(true);

    const { data, error } = await supabase
      .from("draft_posts")
      .upsert(
        { circle_id: circleId, user_id: userId, content: trimmed },
        { onConflict: "circle_id,user_id" },
      )
      .select("id, content")
      .single();

    setIsSubmitting(false);
    if (!error && data) {
      setDraft(data);
      setIsEditing(false);
      setContent("");
    }
  }

  function handleEdit() {
    if (!draft) return;
    setContent(draft.content);
    setIsEditing(true);
  }

  async function handleDelete() {
    if (!draft) return;
    await supabase.from("draft_posts").delete().eq("id", draft.id);
    setDraft(null);
    setIsEditing(false);
  }

  const showDraftCard = draft && !isEditing;

  return (
    <div className="flex min-h-[calc(100vh-3rem)] flex-col">
      <header className="flex flex-wrap items-center justify-between gap-y-2 px-4 py-3 sm:px-6">
        <h1 className="text-lg font-semibold text-ink">{circleDisplayName}</h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Link href="/resources" className="px-2 py-1.5 text-sm text-muted hover:text-ink">
            Resources
          </Link>
          <Link href="/profile" className="px-2 py-1.5 text-sm text-muted hover:text-ink">
            Profile
          </Link>
          <SignOutButton />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[560px] flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:py-24">
        <h2 className="font-semibold text-ink text-2xl">You are the first one here.</h2>
        <p className="mt-4 leading-relaxed text-muted">
          Your circle is forming. Others who understand what you have been
          through are finding their way here. You will not be waiting alone.
        </p>

        <div className="mt-10 h-px w-16 bg-border" />

        {showDraftCard && (
          <div className="mt-10 w-full">
            <h3 className="text-lg font-semibold text-ink">Your words are ready.</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              When someone joins your circle your message will be there
              waiting for them. Thank you for being the first.
            </p>

            <div className="mt-6 rounded-2xl bg-surface2 p-5 text-left">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink">{draft!.content}</p>
              <div className="mt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={handleEdit}
                  className="text-xs font-medium text-muted hover:text-ink"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="text-xs font-medium text-muted hover:text-ink"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {!showDraftCard && !dismissed && (
          <div className="mt-10 w-full">
            <h3 className="text-lg font-semibold text-ink">Would you like to share something while you wait?</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Your words will be the first thing your circle sees when they
              arrive. Even one sentence can mean everything to someone who
              finally feels understood.
            </p>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
              rows={5}
              autoFocus
              placeholder="Share whatever feels right. There are no wrong words here."
              className="mt-6 w-full resize-none rounded-xl border border-border bg-surface2 px-4 py-3 text-left text-sm text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            />
            <div className="mt-1 text-right text-xs text-faint">
              {content.length}/{MAX_LENGTH}
            </div>

            <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={handleSave}
                disabled={isSubmitting || !content.trim()}
                className="w-full sm:w-auto"
              >
                {isSubmitting ? "Saving…" : "Save for my circle"}
              </Button>
              <Button
                variant="outline"
                onClick={() => (isEditing ? setIsEditing(false) : setDismissed(true))}
                className="w-full sm:w-auto"
              >
                {isEditing ? "Cancel" : "Maybe later"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
