import Link from "next/link";
import { notFound } from "next/navigation";
import { LandingNav } from "../../_landing/LandingNav";
import { LandingFooter } from "../../_landing/LandingFooter";
import { fraunces, karla } from "@/lib/fonts";
import { getAllPosts, getPostBySlug, getRelatedPosts } from "@/lib/blog";
import { PostBody } from "../PostBody";
import { BlogCard } from "../BlogCard";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://betweenus.app";

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) return {};

  const url = `${SITE_URL}/blog/${post.slug}`;
  return {
    title: `${post.title} — Between Us`,
    description: post.excerpt,
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url,
      type: "article",
      publishedTime: post.date,
    },
  };
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  const related = getRelatedPosts(post);

  return (
    <main className={`landing-theme font-karla ${fraunces.variable} ${karla.variable}`}>
      <LandingNav />

      <article className="mx-auto w-full max-w-[680px] px-6 pb-24 pt-32 sm:pt-40">
        <Link href="/blog" className="text-sm text-muted hover:text-ink">
          ← Back to blog
        </Link>

        <span className="mt-6 block w-fit rounded-full bg-sage-soft px-3 py-1 text-xs font-medium text-sage">
          {post.category}
        </span>

        <h1 className="mt-4 text-balance font-display text-[clamp(2rem,4.5vw,2.75rem)] font-medium leading-tight text-ink">
          {post.title}
        </h1>

        <p className="mt-4 text-sm text-faint">
          {formatDate(post.date)} · {post.readTime}
        </p>

        <PostBody content={post.body} />

        <div className="mt-14 rounded-2xl bg-sage-soft p-6 text-center sm:p-8">
          <p className="text-base leading-relaxed text-ink">
            You are not alone in this. Between Us is a free anonymous
            community for people healing from relationship trauma.
          </p>
          <Link
            href="/register"
            className="mt-5 inline-block rounded-full bg-gradient-ember px-7 py-3 font-medium text-accent-text shadow-lift transition-transform duration-300 ease-calm hover:-translate-y-0.5"
          >
            Find your circle
          </Link>
        </div>

        {related.length > 0 && (
          <div className="mt-16">
            <h2 className="font-display text-xl font-medium text-ink">Related posts</h2>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              {related.map((r) => (
                <BlogCard key={r.slug} post={r} />
              ))}
            </div>
          </div>
        )}
      </article>

      <LandingFooter />
    </main>
  );
}
