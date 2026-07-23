"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { EmojiPicker } from "./EmojiPicker";
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    function handlePointerDown(e: MouseEvent | TouchEvent) {
      const textarea = textareaRef.current;
      if (!textarea || document.activeElement !== textarea) return;
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        textarea.blur();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, []);

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

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  }

  function insertEmoji(emoji: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setContent((prev) => (prev + emoji).slice(0, MAX_LENGTH));
      setShowEmojiPicker(false);
      return;
    }

    const start = textarea.selectionStart ?? content.length;
    const end = textarea.selectionEnd ?? content.length;
    const next = (content.slice(0, start) + emoji + content.slice(end)).slice(0, MAX_LENGTH);
    setContent(next);
    setShowEmojiPicker(false);

    requestAnimationFrame(() => {
      const cursor = start + emoji.length;
      textarea.focus();
      textarea.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-2">
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

      <div ref={wrapperRef} className="flex items-start gap-2">
        <div className="relative shrink-0 pt-1">
          <button
            type="button"
            onClick={() => setShowEmojiPicker((v) => !v)}
            aria-label="Add emoji"
            className="rounded-lg p-1.5 text-lg leading-none text-muted hover:bg-surface2 hover:text-ink"
          >
            🙂
          </button>
          {showEmojiPicker && (
            <EmojiPicker onSelect={insertEmoji} onClose={() => setShowEmojiPicker(false)} />
          )}
        </div>

        <textarea
          ref={textareaRef}
          id={textareaId}
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={parentId ? 2 : 3}
          autoFocus={autoFocus}
          className="w-full flex-1 resize-none rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
        />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-faint">
          {content.length}/{MAX_LENGTH}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => textareaRef.current?.blur()}
            aria-label="Dismiss keyboard"
            title="Dismiss keyboard"
            className="rounded-lg p-1.5 text-muted hover:bg-surface2 hover:text-ink"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M6 15l6 6 6-6" />
              <path d="M4 4h16v10H4z" />
            </svg>
          </button>
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
