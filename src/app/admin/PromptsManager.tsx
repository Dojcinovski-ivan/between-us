"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, categoryLabel, type CategorySlug } from "@/lib/categories";
import { nextMonday, toDateInputValue } from "@/lib/time";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Prompt } from "./types";

export function PromptsManager({ initialPrompts }: { initialPrompts: Prompt[] }) {
  const supabase = createClient();
  const [prompts, setPrompts] = useState(initialPrompts);
  const [category, setCategory] = useState<CategorySlug>(CATEGORIES[0].slug);
  const [weekStart, setWeekStart] = useState(toDateInputValue(nextMonday()));
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

    const { data, error: insertError } = await supabase
      .from("prompts")
      .insert({ category, week_start: weekStart, content: trimmed, created_by: user?.id })
      .select("id, category, content, week_start")
      .single();

    setIsSubmitting(false);

    if (insertError || !data) {
      setError("Something went wrong creating that prompt. Please try again.");
      return;
    }

    setPrompts((prev) =>
      [...prev, data].sort((a, b) => (a.week_start < b.week_start ? 1 : -1)),
    );
    setContent("");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="text-sm font-medium text-ink">New prompt</h2>
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategorySlug)}
              className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            >
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Week start</label>
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Prompt</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              placeholder="What's one thing you wish someone had told you sooner?"
              className="resize-none rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            />
          </div>

          {error && <p className="text-xs text-warn">{error}</p>}

          <Button type="submit" disabled={isSubmitting || !content.trim()} className="w-fit">
            {isSubmitting ? "Creating…" : "Create prompt"}
          </Button>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">All prompts</h2>
        {prompts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
            No prompts yet.
          </p>
        ) : (
          <Card className="divide-y divide-border p-0">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="rounded-full bg-sage-soft px-2 py-0.5 text-sage">
                    {categoryLabel(prompt.category)}
                  </span>
                  <span>{prompt.week_start}</span>
                </div>
                <p className="mt-2 text-sm text-ink">{prompt.content}</p>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
