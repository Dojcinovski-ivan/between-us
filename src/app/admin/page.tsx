import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { weekStart } from "@/lib/time";
import { SignOutButton } from "@/components/SignOutButton";
import { AdminPanel } from "./AdminPanel";
import type { PendingReport, Prompt, Resource } from "./types";

export const metadata = {
  title: "Admin — Between Us",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) redirect("/login");
  if (!profile || !profile.circle_id) redirect("/onboarding");
  if (!profile.is_admin) redirect("/circle");

  const supabase = createClient();
  const thisWeekStart = weekStart(new Date()).toISOString();

  const [
    { data: reports },
    { data: prompts },
    { data: resources },
    { count: totalUsers },
    { count: totalCircles },
    { count: totalPosts },
    { count: pendingReports },
    { count: resolvedThisWeek },
  ] = await Promise.all([
    supabase
      .from("reports")
      .select("id, reason, created_at, reporter:users(username), post:posts(id, content, users(username))")
      .eq("status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("prompts")
      .select("id, category, content, week_start")
      .order("week_start", { ascending: false }),
    supabase
      .from("resources")
      .select("id, title, type, description, url, category")
      .order("created_at", { ascending: false }),
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("circles").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("is_removed", false),
    supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .neq("status", "pending")
      .gte("updated_at", thisWeekStart),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/circle" className="text-sm text-muted hover:text-ink">
          ← Back to your circle
        </Link>
        <SignOutButton />
      </div>

      <h1 className="text-2xl font-semibold text-ink">Admin</h1>
      <p className="mt-1 text-sm text-muted">Keeping the circles calm and safe.</p>

      <div className="mt-6">
        <AdminPanel
          initialReports={(reports as unknown as PendingReport[]) ?? []}
          initialPrompts={(prompts as Prompt[]) ?? []}
          initialResources={(resources as Resource[]) ?? []}
          stats={{
            totalUsers: totalUsers ?? 0,
            totalCircles: totalCircles ?? 0,
            totalPosts: totalPosts ?? 0,
            pendingReports: pendingReports ?? 0,
            resolvedThisWeek: resolvedThisWeek ?? 0,
          }}
        />
      </div>
    </main>
  );
}
