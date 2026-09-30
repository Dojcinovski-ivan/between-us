"use server";

import { getCurrentUserAndProfile } from "@/lib/auth";
import { recordMentionsFor } from "@/lib/recordMentions";

// The logic lives in recordMentions.ts, shared with the iOS app's
// /api/mobile/mentions route.
export async function recordMentions(postId: string): Promise<void> {
  const { user } = await getCurrentUserAndProfile();
  if (!user) return;
  await recordMentionsFor(user.id, postId);
}
