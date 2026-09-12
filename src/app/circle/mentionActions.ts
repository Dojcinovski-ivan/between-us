"use server";

import { getCurrentUserAndProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractMentionNames } from "@/lib/mentions";
import { sendMentionEmail } from "@/lib/email";

/**
 * Records the mentions in a post that has already been created, and tells
 * the people named.
 *
 * Called after the insert has succeeded, never before and never as part of
 * it: posting is client side and stays that way, so nothing here can slow
 * a post down, block it, or fail it. Every path returns quietly.
 *
 * Writes go through the service role because post_mentions is closed to
 * client writes, which is what stops anyone forging a mention for someone
 * else. The caller is still checked against the post's own author first,
 * so this cannot be pointed at a post you did not write.
 */
export async function recordMentions(postId: string): Promise<void> {
  try {
    const { user } = await getCurrentUserAndProfile();
    if (!user) return;

    const admin = createAdminClient();

    const { data: post } = await admin
      .from("posts")
      .select("id, circle_id, user_id, content, is_removed")
      .eq("id", postId)
      .maybeSingle();

    // Only the author of a post may generate its mentions.
    if (!post || post.user_id !== user.id || post.is_removed) return;

    const names = extractMentionNames(post.content);
    if (names.length === 0) return;

    // Resolved against members of this circle only. A name that belongs to
    // somebody in another circle simply does not resolve, so this can never
    // be used to probe whether a username exists elsewhere in the app.
    const { data: members } = await admin
      .from("users")
      .select("id, username, email_marketing_consent")
      .eq("circle_id", post.circle_id);

    const byName = new Map(
      (members ?? []).map((m) => [m.username.toLowerCase(), m] as const),
    );

    const mentioned = names
      .map((name) => byName.get(name))
      .filter((m): m is NonNullable<typeof m> => !!m)
      // Mentioning yourself styles the text but tells nobody.
      .filter((m) => m.id !== post.user_id);

    if (mentioned.length === 0) return;

    // ignoreDuplicates leans on the unique(post_id, mentioned_user_id)
    // constraint, so a double submit cannot produce a second email.
    const { data: inserted } = await admin
      .from("post_mentions")
      .upsert(
        mentioned.map((m) => ({
          post_id: post.id,
          mentioned_user_id: m.id,
          mentioning_user_id: post.user_id,
        })),
        { onConflict: "post_id,mentioned_user_id", ignoreDuplicates: true },
      )
      .select("mentioned_user_id");

    // Only rows that were genuinely new come back, so re-running this for
    // the same post never mails anyone twice.
    const freshIds = new Set((inserted ?? []).map((r) => r.mentioned_user_id));
    if (freshIds.size === 0) return;

    const { data: author } = await admin
      .from("users")
      .select("username")
      .eq("id", post.user_id)
      .maybeSingle();

    const authorName = author?.username ?? "Someone";

    // Awaited rather than fired and forgotten: a serverless function can be
    // frozen the moment its response starts, which would silently drop an
    // un-awaited send. Each send swallows its own errors.
    await Promise.allSettled(
      mentioned
        .filter((m) => freshIds.has(m.id) && m.email_marketing_consent === true)
        .map((m) => sendMentionEmail(m.id, authorName)),
    );
  } catch {
    // Best effort throughout. A mention that fails to record must never
    // surface to the person who just posted.
  }
}
