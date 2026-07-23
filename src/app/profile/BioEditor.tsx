"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

const MAX_LENGTH = 200;

export function BioEditor({ userId, initialBio }: { userId: string; initialBio: string | null }) {
  const supabase = createClient();
  const [bio, setBio] = useState(initialBio ?? "");
  const [savedBio, setSavedBio] = useState(initialBio ?? "");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setIsSaving(true);
    setError(null);
    const trimmed = bio.trim();

    const { error: updateError } = await supabase
      .from("users")
      .update({ bio: trimmed || null })
      .eq("id", userId);

    setIsSaving(false);

    if (updateError) {
      setError("Something went wrong saving that. Please try again.");
      return;
    }

    setSavedBio(trimmed);
    setBio(trimmed);
    setIsEditing(false);
  }

  function handleCancel() {
    setBio(savedBio);
    setError(null);
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted">About</p>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="text-xs text-sage hover:text-sage-hover"
          >
            Edit
          </button>
        </div>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink">
          {savedBio || <span className="text-faint">Nothing shared yet.</span>}
        </p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm font-medium text-muted">About</p>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value.slice(0, MAX_LENGTH))}
        rows={3}
        autoFocus
        placeholder="Share as much or as little as you'd like."
        className="mt-1 w-full resize-none rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
      />
      <div className="mt-1 flex items-center justify-between">
        <span className="text-xs text-faint">
          {bio.length}/{MAX_LENGTH}
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-warn">{error}</p>}
    </div>
  );
}
