import "server-only";
import { createClient } from "@/lib/supabase/server";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  content: string;
};

function formatReadTime(minutes: number): string {
  return `${minutes} min read`;
}

type Row = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  read_time: number;
  published_at: string | null;
  created_at: string;
};

function toBlogPost(row: Row): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    date: row.published_at ?? row.created_at,
    category: row.category,
    readTime: formatReadTime(row.read_time),
    content: row.content,
  };
}

// Explicitly filtered to published posts regardless of who's asking, so
// an admin's own drafts never show up in the public index, sitemap, or
// related posts. getPostBySlug below deliberately has no such filter —
// visibility there is left entirely to RLS, which is what lets an admin
// open a draft's own URL as a live preview while everyone else gets a 404.
export async function getAllPosts(): Promise<BlogPost[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("title, slug, excerpt, content, category, read_time, published_at, created_at")
    .eq("published", true)
    .order("published_at", { ascending: false });

  return ((data as Row[] | null) ?? []).map(toBlogPost);
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("blog_posts")
    .select("title, slug, excerpt, content, category, read_time, published_at, created_at")
    .eq("slug", slug)
    .maybeSingle();

  return data ? toBlogPost(data as Row) : null;
}

// Same category first, filled out with the most recent other posts if
// the category does not have enough on its own.
export async function getRelatedPosts(post: BlogPost, count = 2): Promise<BlogPost[]> {
  const others = (await getAllPosts()).filter((p) => p.slug !== post.slug);
  const sameCategory = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);
  return [...sameCategory, ...rest].slice(0, count);
}
