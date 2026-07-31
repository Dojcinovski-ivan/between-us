import Link from "next/link";
import type { BlogPost } from "@/lib/blog";

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function BlogCard({ post }: { post: BlogPost }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="flex flex-col rounded-2xl border border-border bg-surface p-6 transition-transform duration-300 ease-calm hover:-translate-y-0.5 hover:shadow-soft"
    >
      <span className="w-fit rounded-full bg-sage-soft px-3 py-1 text-xs font-medium text-sage">
        {post.category}
      </span>
      <h2 className="mt-4 font-display text-xl font-medium leading-snug text-ink">{post.title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
      <p className="mt-4 text-xs text-faint">
        {formatDate(post.date)} · {post.readTime}
      </p>
    </Link>
  );
}
