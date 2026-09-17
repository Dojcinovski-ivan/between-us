"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { runBlogGeneration } from "@/lib/blogPipeline";
import type { BlogTopic } from "./types";

// Server actions behind the admin Queue tab. Each one re-checks is_admin
// against the caller's own session first: a server action is a plain
// request anyone can shape, so the tab being hidden in the UI is not a
// control. Same pattern as circleActions.ts.
//
// Writes go through the service role because blog_topic_queue is closed to
// client writes by design (see 0027_blog_topic_queue).

async function requireAdmin() {
  const { user, profile } = await getCurrentUserAndProfile();
  return user && profile?.is_admin ? user : null;
}

export async function listQueue(): Promise<BlogTopic[]> {
  if (!(await requireAdmin())) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("blog_topic_queue")
    .select("id, topic, target_keyword, category, status, blog_post_id, failure_reason, created_at, generated_at")
    .order("created_at", { ascending: true });

  return (data as BlogTopic[] | null) ?? [];
}

export async function setTopicStatus(
  id: string,
  status: "pending" | "skipped",
): Promise<{ ok: boolean; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorised" };

  const admin = createAdminClient();
  const { error } = await admin
    .from("blog_topic_queue")
    // Clearing the reason on unskip stops an old "duplicate of" note
    // hanging around on a topic that has been deliberately reinstated.
    .update({ status, failure_reason: status === "pending" ? null : "Skipped by an admin" })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin");
  return { ok: true };
}

export async function triggerGeneration(): Promise<{ ok: boolean; summary?: string; error?: string }> {
  if (!(await requireAdmin())) return { ok: false, error: "Not authorised" };

  try {
    // A shorter budget than the cron run: this one is blocking a person
    // staring at a spinner, not a background job.
    const result = await runBlogGeneration({ deadlineAt: Date.now() + 240_000 });
    revalidatePath("/admin");

    const parts: string[] = [];
    if (result.topicsGenerated) parts.push(`${result.topicsGenerated} new topics queued`);
    if (result.published.length) parts.push(`${result.published.length} published`);
    if (result.held.length) parts.push(`${result.held.length} held for review`);
    if (result.failed.length) parts.push(`${result.failed.length} failed`);
    if (result.stoppedEarly) parts.push("stopped early on the time budget");

    return { ok: true, summary: parts.length ? parts.join(", ") : "Nothing to do, the queue is empty" };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}
