import Link from "next/link";
import { LandingNav } from "../_landing/LandingNav";
import { LandingFooter } from "../_landing/LandingFooter";
import { fraunces, karla } from "@/lib/fonts";
import { getAllPosts } from "@/lib/blog";
import { BlogCard } from "./BlogCard";

export const metadata = {
  title: "Stories and Insights — Between Us",
  description:
    "Thoughts on healing, relationships, and finding your way back to yourself, from the Between Us community.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <main className={`landing-theme font-karla ${fraunces.variable} ${karla.variable}`}>
      <LandingNav />

      <div className="mx-auto w-full max-w-4xl px-6 pb-24 pt-32 sm:pt-40">
        <h1 className="text-balance font-display text-[clamp(2.25rem,5vw,3.25rem)] font-medium text-ink">
          Stories and Insights
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
          Thoughts on healing, relationships, and finding your way back to
          yourself.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {posts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/register"
            className="inline-block rounded-full bg-gradient-ember px-8 py-3.5 font-medium text-accent-text shadow-lift transition-transform duration-300 ease-calm hover:-translate-y-0.5"
          >
            Find your circle
          </Link>
        </div>
      </div>

      <LandingFooter />
    </main>
  );
}
