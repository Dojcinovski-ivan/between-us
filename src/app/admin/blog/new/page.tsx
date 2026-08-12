import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { SignOutButton } from "@/components/SignOutButton";
import { BlogPostEditor } from "../BlogPostEditor";

export const metadata = {
  title: "New Post — Admin — Between Us",
  robots: { index: false, follow: false },
};

export default async function NewBlogPostPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) redirect("/login");
  if (!profile || !profile.circle_id) redirect("/onboarding");
  if (!profile.is_admin) redirect("/circle");

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/admin" className="text-sm text-muted hover:text-ink">
          ← Back to admin
        </Link>
        <SignOutButton />
      </div>

      <h1 className="text-2xl font-semibold text-ink">New post</h1>
      <p className="mt-1 text-sm text-muted">Write and publish a new blog post.</p>

      <div className="mt-6">
        <BlogPostEditor />
      </div>
    </main>
  );
}
