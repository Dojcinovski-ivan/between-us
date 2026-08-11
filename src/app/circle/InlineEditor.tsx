"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const MAX_LENGTH = 1000;

export function InlineEditor({
  initialContent,
  isOwnPost,
  onSave,
  onCancel,
}: {
  initialContent: string;
  isOwnPost: boolean;
  onSave: (content: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [content, setContent] = useState(initialContent);
  const [isSaving, setIsSaving] = useState(false);

  async function handleSave() {
    const trimmed = content.trim();
    if (!trimmed) return;
    if (trimmed === initialContent) {
      onCancel();
      return;
    }
    setIsSaving(true);
    await onSave(trimmed);
    setIsSaving(false);
  }

  return (
    <div className={`flex w-full max-w-[80%] flex-col gap-2 sm:max-w-[60%] ${isOwnPost ? "items-end" : "items-start"}`}>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value.slice(0, MAX_LENGTH))}
        rows={3}
        autoFocus
        className="w-full resize-none rounded-xl border border-sage bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-sage"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-xs text-muted hover:bg-surface2"
        >
          Cancel
        </button>
        <Button type="button" onClick={handleSave} disabled={isSaving || !content.trim()} className="px-4 py-1.5 text-xs">
          {isSaving ? "Saving…" : "Save"}
        </Button>
      </div>
    </div>
  );
}
