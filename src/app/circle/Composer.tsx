"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import type { Post } from "./types";

const MAX_LENGTH = 1000;

type ComposerProps = {
  circleId: string;
  parentId: string | null;
  textareaId?: string;
  placeholder?: string;
  isPromptResponse?: boolean;
  onClearPromptResponse?: () => void;
  onSubmitted: (post: Post) => void;
  onCancel?: () => void;
  autoFocus?: boolean;
};

export function Composer({
  circleId,
  parentId,
  textareaId,
  placeholder = "Share what's on your mind…",
  isPromptResponse = false,
  onClearPromptResponse,
  onSubmitted,
  onCancel,
  autoFocus = false,
}: ComposerProps) {
  const supabase = createClient();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Your session expired. Please refresh the page.");
      setIsSubmitting(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from("posts")
      .insert({
        circle_id: circleId,
        user_id: user.id,
        content: trimmed,
        parent_id: parentId,
        is_prompt_response: isPromptResponse,
      })
      .select("*, users(username)")
      .single();

    setIsSubmitting(false);

    if (insertError || !data) {
      setError("Something went wrong posting that. Please try again.");
      return;
    }

    setContent("");
    onClearPromptResponse?.();
    onSubmitted(data as Post);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      {isPromptResponse && (
        <div className="flex w-fit items-center gap-2 rounded-full bg-sage-soft px-3 py-1 text-xs text-sage">
          Responding to this week&apos;s prompt
          <button
            type="button"
            onClick={onClearPromptResponse}
            aria-label="Clear prompt response"
            className="text-sage hover:text-sage-hover"
          >
            ✕
          </button>
        </div>
      )}

      <textarea
        id={textareaId}
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
        placeholder={placeholder}
        rows={parentId ? 2 : 3}
        autoFocus={autoFocus}
        className="w-full resize-none rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-faint">
          {content.length}/{MAX_LENGTH}
        </span>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting || !content.trim()}>
            {isSubmitting ? "Posting…" : parentId ? "Reply" : "Post"}
          </Button>
        </div>
      </div>

      {error && <p className="text-xs text-warn">{error}</p>}
    </form>
  );
}
