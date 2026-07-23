"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Resource } from "./types";

const RESOURCE_TYPES = [
  { value: "book", label: "Book" },
  { value: "link", label: "Link" },
];

export function ResourcesManager({ initialResources }: { initialResources: Resource[] }) {
  const supabase = createClient();
  const [resources, setResources] = useState(initialResources);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("book");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    setIsSubmitting(true);
    setError(null);

    const { data, error: insertError } = await supabase
      .from("resources")
      .insert({
        title: trimmedTitle,
        type,
        description: description.trim() || null,
        url: url.trim() || null,
        category: category || null,
      })
      .select("id, title, type, description, url, category")
      .single();

    setIsSubmitting(false);

    if (insertError || !data) {
      setError("Something went wrong creating that resource. Please try again.");
      return;
    }

    setResources((prev) => [data, ...prev]);
    setTitle("");
    setDescription("");
    setUrl("");
    setCategory("");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <h2 className="text-sm font-medium text-ink">New resource</h2>
        <form onSubmit={handleSubmit} className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
              placeholder="e.g. The Body Keeps the Score"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            >
              {RESOURCE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Description (optional)</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
              placeholder="e.g. Bessel van der Kolk"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">URL (optional)</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
              placeholder="https://…"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Category (optional)</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            >
              <option value="">General — all circles</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-warn">{error}</p>}

          <Button type="submit" disabled={isSubmitting || !title.trim()} className="w-fit">
            {isSubmitting ? "Creating…" : "Create resource"}
          </Button>
        </form>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-medium text-muted">All resources</h2>
        {resources.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
            No resources yet.
          </p>
        ) : (
          <Card className="divide-y divide-border p-0">
            {resources.map((r) => (
              <div key={r.id} className="p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span className="rounded-full bg-sage-soft px-2 py-0.5 text-sage">{r.type}</span>
                  {r.category && <span>{categoryLabel(r.category)}</span>}
                </div>
                <p className="mt-2 text-sm font-medium text-ink">{r.title}</p>
                {r.description && <p className="text-xs text-muted">{r.description}</p>}
                {r.url && <p className="text-xs text-faint">{r.url}</p>}
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
