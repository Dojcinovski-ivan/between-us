import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/SignOutButton";
import { BlogPostEditor } from "../../BlogPostEditor";
import type { BlogPostFull } from "../../../types";

export const metadata = {
  title: "Edit Post — Admin — Between Us",
  robots: { index: false, follow: false },
};

export default async function EditBlogPostPage({ params }: { params: { id: string } }) {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");
  if (!profile.is_admin) redirect("/circle");

  const supabase = createClient();
  const { data: post } = await supabase
    .from("blog_posts")
    .select("id, title, slug, excerpt, content, meta_description, category, read_time, published, published_at")
    .eq("id", params.id)
    .maybeSingle();

  if (!post) notFound();

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin" className="text-sm text-muted hover:text-ink">
          ← Back to admin
        </Link>
        <SignOutButton />
      </div>

      <h1 className="text-2xl font-semibold text-ink">Edit post</h1>
      <p className="mt-1 text-sm text-muted">{post.title}</p>

      <div className="mt-6">
        <BlogPostEditor initialPost={post as BlogPostFull} />
      </div>
    </main>
  );
}
