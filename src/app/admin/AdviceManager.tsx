"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, categoryLabel, type CategorySlug } from "@/lib/categories";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { DailyAdvice } from "./types";

export function AdviceManager({ initialAdvice }: { initialAdvice: DailyAdvice[] }) {
  const supabase = createClient();
  const [advice, setAdvice] = useState(initialAdvice);
  const [category, setCategory] = useState<CategorySlug>(CATEGORIES[0].slug);
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("daily_advice")
      .insert({ category, content: trimmed })
      .select("id, category, content")
      .single();

    setIsSubmitting(false);

    if (insertError || !data) {
      setError("Something went wrong saving that. Please try again.");
      return;
    }

    setAdvice((prev) => [data, ...prev]);
    setContent("");
  }

  async function handleDelete(id: string) {
    const { error: deleteError } = await supabase.from("daily_advice").delete().eq("id", id);
    if (!deleteError) {
      setAdvice((prev) => prev.filter((a) => a.id !== id));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="text-sm font-medium text-ink">New advice</h2>
        <p className="mt-1 text-xs text-muted">
          Each circle shows one line from its category per day, rotating automatically.
        </p>
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
            <label className="text-sm font-medium text-muted">Advice</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              placeholder="A short, supportive line for this circle."
              className="resize-none rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            />
          </div>
          {error && <p className="text-sm text-warn">{error}</p>}
          <Button type="submit" disabled={isSubmitting || !content.trim()} className="w-fit">
            {isSubmitting ? "Saving…" : "Add advice"}
          </Button>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">All advice</h2>
        {advice.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
            No advice yet. Add a few lines per category above.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {advice.map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-4"
              >
                <div>
                  <p className="text-xs font-medium text-sage">{categoryLabel(a.category)}</p>
                  <p className="mt-1 text-sm text-ink">{a.content}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="shrink-0 text-xs text-muted hover:text-warn"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
