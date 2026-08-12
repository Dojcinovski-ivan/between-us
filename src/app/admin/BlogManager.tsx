"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { BlogPostSummary } from "./types";

function formatDate(date: string | null): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function PostRow({
  post,
  onTogglePublished,
  onDelete,
}: {
  post: BlogPostSummary;
  onTogglePublished: (post: BlogPostSummary) => void;
  onDelete: (post: BlogPostSummary) => void;
}) {
  const [isWorking, setIsWorking] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">{post.title}</p>
        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="rounded-full bg-sage-soft px-2 py-0.5 text-sage">{post.category}</span>
          {post.published && post.published_at && <span>Published {formatDate(post.published_at)}</span>}
          {!post.published && <span>Draft</span>}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Link
          href={`/admin/blog/${post.id}/edit`}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-surface2 hover:text-ink"
        >
          Edit
        </Link>
        <button
          type="button"
          disabled={isWorking}
          onClick={async () => {
            setIsWorking(true);
            await onTogglePublished(post);
            setIsWorking(false);
          }}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted hover:bg-surface2 hover:text-ink disabled:opacity-50"
        >
          {post.published ? "Unpublish" : "Publish"}
        </button>
        <button
          type="button"
          disabled={isWorking}
          onClick={async () => {
            if (!window.confirm(`Delete "${post.title}"? This can't be undone.`)) return;
            setIsWorking(true);
            await onDelete(post);
          }}
          className="rounded-lg border border-border px-3 py-1.5 text-xs text-warn hover:bg-surface2 disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export function BlogManager({ initialPosts }: { initialPosts: BlogPostSummary[] }) {
  const supabase = createClient();
  const [posts, setPosts] = useState(initialPosts);

  const published = posts
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime());
  const drafts = posts.filter((p) => !p.published);

  async function togglePublished(post: BlogPostSummary) {
    const nextPublished = !post.published;
    const update: { published: boolean; published_at?: string } = { published: nextPublished };
    if (nextPublished && !post.published_at) update.published_at = new Date().toISOString();

    const { error } = await supabase.from("blog_posts").update(update).eq("id", post.id);
    if (error) return;

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, published: nextPublished, published_at: update.published_at ?? p.published_at } : p,
      ),
    );
  }

  async function deletePost(post: BlogPostSummary) {
    const { error } = await supabase.from("blog_posts").delete().eq("id", post.id);
    if (error) return;
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted">Blog posts</h2>
        <Link href="/admin/blog/new">
          <Button className="px-4 py-2 text-sm">New post</Button>
        </Link>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-muted">Published ({published.length})</h3>
        {published.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
            No published posts yet.
          </p>
        ) : (
          <Card className="divide-y divide-border p-0">
            {published.map((post) => (
              <PostRow key={post.id} post={post} onTogglePublished={togglePublished} onDelete={deletePost} />
            ))}
          </Card>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-medium text-muted">Drafts ({drafts.length})</h3>
        {drafts.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
            No drafts.
          </p>
        ) : (
          <Card className="divide-y divide-border p-0">
            {drafts.map((post) => (
              <PostRow key={post.id} post={post} onTogglePublished={togglePublished} onDelete={deletePost} />
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
