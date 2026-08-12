"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { slugify } from "@/lib/slugify";
import { BLOG_CATEGORIES, type BlogPostFull } from "../types";

const EXCERPT_MAX = 200;
const META_MAX = 155;
const AUTOSAVE_INTERVAL_MS = 30_000;

type ToolbarAction = "bold" | "italic" | "h2" | "h3" | "link" | "bullet";

// Applies a markdown formatting action to a textarea's current selection
// (or the current line, for line-level actions), then restores focus and
// selection so typing can continue without a click.
function applyFormatting(textarea: HTMLTextAreaElement, action: ToolbarAction, content: string): string | null {
  const { selectionStart, selectionEnd } = textarea;
  const selected = content.slice(selectionStart, selectionEnd);

  function wrap(marker: string) {
    const next = content.slice(0, selectionStart) + marker + selected + marker + content.slice(selectionEnd);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart + marker.length, selectionEnd + marker.length);
    });
    return next;
  }

  function prefixLines(marker: string) {
    const lineStart = content.lastIndexOf("\n", selectionStart - 1) + 1;
    let lineEnd = content.indexOf("\n", selectionEnd);
    if (lineEnd === -1) lineEnd = content.length;

    const block = content.slice(lineStart, lineEnd);
    const prefixed = block
      .split("\n")
      .map((line) => (line.startsWith(marker) ? line : `${marker}${line}`))
      .join("\n");

    const next = content.slice(0, lineStart) + prefixed + content.slice(lineEnd);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(lineStart, lineStart + prefixed.length);
    });
    return next;
  }

  switch (action) {
    case "bold":
      return wrap("**");
    case "italic":
      return wrap("*");
    case "h2":
      return prefixLines("## ");
    case "h3":
      return prefixLines("### ");
    case "bullet":
      return prefixLines("- ");
    case "link": {
      const url = window.prompt("Link URL");
      if (!url) return null;
      const label = selected || "link text";
      const markdown = `[${label}](${url})`;
      const next = content.slice(0, selectionStart) + markdown + content.slice(selectionEnd);
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(selectionStart + markdown.length, selectionStart + markdown.length);
      });
      return next;
    }
  }
}

export function BlogPostEditor({ initialPost }: { initialPost?: BlogPostFull }) {
  const supabase = createClient();
  const router = useRouter();
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const [postId, setPostId] = useState(initialPost?.id ?? null);
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initialPost);
  const [category, setCategory] = useState(initialPost?.category ?? BLOG_CATEGORIES[0]);
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [metaDescription, setMetaDescription] = useState(initialPost?.meta_description ?? "");
  const [readTime, setReadTime] = useState(initialPost?.read_time ?? 5);
  const [content, setContent] = useState(initialPost?.content ?? "");
  const [published, setPublished] = useState(initialPost?.published ?? false);
  const [publishedAt, setPublishedAt] = useState(initialPost?.published_at ?? null);
  const [keyword, setKeyword] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  function handleSlugChange(value: string) {
    setSlugTouched(true);
    setSlug(value);
  }

  function handleToolbarClick(action: ToolbarAction) {
    const textarea = contentRef.current;
    if (!textarea) return;
    const next = applyFormatting(textarea, action, content);
    if (next !== null) setContent(next);
  }

  async function save(nextPublished: boolean, { silent = false }: { silent?: boolean } = {}) {
    if (!title.trim() || !slug.trim() || !excerpt.trim() || !metaDescription.trim()) {
      if (!silent) setError("Title, slug, excerpt, and meta description are all required.");
      return false;
    }

    setIsSaving(true);
    setError(null);

    const nextPublishedAt = nextPublished && !publishedAt ? new Date().toISOString() : publishedAt;
    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content,
      meta_description: metaDescription.trim(),
      category,
      read_time: readTime,
      published: nextPublished,
      published_at: nextPublishedAt,
    };

    if (postId) {
      const { error: updateError } = await supabase.from("blog_posts").update(payload).eq("id", postId);
      setIsSaving(false);
      if (updateError) {
        setError("Something went wrong saving. Please try again.");
        return false;
      }
    } else {
      const { data, error: insertError } = await supabase
        .from("blog_posts")
        .insert(payload)
        .select("id")
        .single();
      setIsSaving(false);
      if (insertError || !data) {
        setError(
          insertError?.code === "23505"
            ? "That slug is already in use by another post."
            : "Something went wrong saving. Please try again.",
        );
        return false;
      }
      setPostId(data.id);
      router.replace(`/admin/blog/${data.id}/edit`);
    }

    setPublished(nextPublished);
    setPublishedAt(nextPublishedAt);
    setSavedAt(new Date());
    return true;
  }

  // Periodically persists whatever is currently in the form, preserving
  // its current published state, so work in progress is never lost.
  // Silent: does not surface the "required fields" error while typing,
  // it just skips the save until those fields are filled in.
  useEffect(() => {
    const timer = setInterval(() => {
      save(published, { silent: true });
    }, AUTOSAVE_INTERVAL_MS);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, slug, excerpt, metaDescription, category, readTime, content, published, postId]);

  async function handlePreview() {
    const ok = await save(published);
    if (!ok) return;
    window.open(`/blog/${slug}`, "_blank");
  }

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  const checklist = [
    { label: "Title contains target keyword", met: keyword.trim() !== "" && title.toLowerCase().includes(keyword.trim().toLowerCase()) },
    { label: "Meta description is under 155 characters", met: metaDescription.length > 0 && metaDescription.length <= META_MAX },
    { label: "Content is over 800 words", met: wordCount > 800 },
    { label: "At least one H2 heading used", met: /^##\s+\S/m.test(content) },
    { label: "Excerpt is filled in", met: excerpt.trim().length > 0 },
    { label: "Slug is set", met: slug.trim().length > 0 },
  ];

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="flex-1 flex flex-col gap-6">
        <Card className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Title</label>
            <input
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Why You Keep Attracting Emotionally Unavailable Partners"
              className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Slug</label>
            <input
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="why-you-keep-attracting-emotionally-unavailable-partners"
              className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            >
              {BLOG_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted">Excerpt</label>
              <span className={`text-xs ${excerpt.length > EXCERPT_MAX ? "text-warn" : "text-faint"}`}>
                {excerpt.length}/{EXCERPT_MAX}
              </span>
            </div>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value.slice(0, EXCERPT_MAX))}
              rows={2}
              placeholder="A one or two sentence preview shown on the blog index."
              className="resize-none rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted">Meta description</label>
              <span className={`text-xs ${metaDescription.length > META_MAX ? "text-warn" : "text-faint"}`}>
                {metaDescription.length}/{META_MAX}
              </span>
            </div>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value.slice(0, META_MAX))}
              rows={2}
              placeholder="Shown in Google search results."
              className="resize-none rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-muted">Estimated read time (minutes)</label>
            <input
              type="number"
              min={1}
              value={readTime}
              onChange={(e) => setReadTime(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-32 rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-muted">Content</label>
              <span className="text-xs text-faint">Markdown supported</span>
            </div>

            <div className="flex flex-wrap gap-1 rounded-t-xl border border-b-0 border-border bg-surface2 p-1.5">
              <button type="button" onClick={() => handleToolbarClick("bold")} className="rounded-lg px-2.5 py-1.5 text-sm font-bold text-muted hover:bg-surface hover:text-ink">
                B
              </button>
              <button type="button" onClick={() => handleToolbarClick("italic")} className="rounded-lg px-2.5 py-1.5 text-sm italic text-muted hover:bg-surface hover:text-ink">
                I
              </button>
              <button type="button" onClick={() => handleToolbarClick("h2")} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted hover:bg-surface hover:text-ink">
                H2
              </button>
              <button type="button" onClick={() => handleToolbarClick("h3")} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-muted hover:bg-surface hover:text-ink">
                H3
              </button>
              <button type="button" onClick={() => handleToolbarClick("link")} className="rounded-lg px-2.5 py-1.5 text-sm text-muted hover:bg-surface hover:text-ink">
                Link
              </button>
              <button type="button" onClick={() => handleToolbarClick("bullet")} className="rounded-lg px-2.5 py-1.5 text-sm text-muted hover:bg-surface hover:text-ink">
                • List
              </button>
            </div>
            <textarea
              ref={contentRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              placeholder="Write in markdown. Select text and use the toolbar above, or type ## for a heading, ** for bold, and so on."
              className="resize-none rounded-b-xl border border-border bg-surface2 px-4 py-3 text-sm leading-relaxed text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            />
            <p className="text-xs text-faint">Images coming soon. Text only for now.</p>
            <p className="text-right text-xs text-faint">{wordCount} words</p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-surface2 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-ink">Published</p>
              <p className="text-xs text-muted">{published ? "Visible on the public blog" : "Only visible to admins"}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={published}
              onClick={() => save(!published)}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${published ? "bg-sage" : "bg-border"}`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-surface shadow-soft transition-transform ${
                  published ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {error && <p className="text-sm text-warn">{error}</p>}

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" disabled={isSaving} onClick={() => save(false)}>
              Save draft
            </Button>
            <Button disabled={isSaving} onClick={() => save(true)}>
              {isSaving ? "Saving…" : "Publish"}
            </Button>
            <Button variant="outline" type="button" disabled={!slug.trim()} onClick={handlePreview}>
              Preview
            </Button>
            {savedAt && (
              <span className="text-xs text-faint">
                Saved {savedAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
              </span>
            )}
          </div>
        </Card>
      </div>

      <div className="w-full lg:w-72 lg:shrink-0">
        <Card className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-ink">SEO checklist</h2>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-muted">Target keyword</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. emotionally unavailable"
              className="rounded-lg border border-border bg-surface2 px-3 py-2 text-xs text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
            />
            <p className="text-[11px] text-faint">Used for the checklist below only, not saved.</p>
          </div>

          <ul className="flex flex-col gap-2.5">
            {checklist.map((item) => (
              <li key={item.label} className="flex items-start gap-2 text-sm">
                <span
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] ${
                    item.met ? "bg-sage text-accent-text" : "bg-border text-faint"
                  }`}
                >
                  {item.met ? "✓" : ""}
                </span>
                <span className={item.met ? "text-ink" : "text-muted"}>{item.label}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
