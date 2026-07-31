import "server-only";
import fs from "fs";
import path from "path";

export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
  body: string;
};

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

// Frontmatter here is deliberately simple, flat "key: value" lines
// between --- markers, so a small hand written parser covers it
// without pulling in a markdown/frontmatter library for three posts.
function parsePost(raw: string): BlogPost {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) throw new Error("Blog post is missing frontmatter");

  const [, frontmatterBlock, body] = match;
  const frontmatter: Record<string, string> = {};
  for (const line of frontmatterBlock.split("\n")) {
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    frontmatter[key] = value;
  }

  return {
    slug: frontmatter.slug,
    title: frontmatter.title,
    excerpt: frontmatter.excerpt,
    date: frontmatter.date,
    category: frontmatter.category,
    readTime: frontmatter.readTime,
    body: body.trim(),
  };
}

export function getAllPosts(): BlogPost[] {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith(".md"));
  const posts = files.map((file) => parsePost(fs.readFileSync(path.join(BLOG_DIR, file), "utf-8")));
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPostBySlug(slug: string): BlogPost | null {
  return getAllPosts().find((p) => p.slug === slug) ?? null;
}

// Same category first, filled out with the most recent other posts if
// the category does not have enough on its own.
export function getRelatedPosts(post: BlogPost, count = 2): BlogPost[] {
  const others = getAllPosts().filter((p) => p.slug !== post.slug);
  const sameCategory = others.filter((p) => p.category === post.category);
  const rest = others.filter((p) => p.category !== post.category);
  return [...sameCategory, ...rest].slice(0, count);
}
