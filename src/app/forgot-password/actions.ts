"use server";

import { sendPasswordResetEmail } from "@/lib/email";

const COOLDOWN_MS = 60_000;

// Sending happens server side because minting the recovery link needs the
// service role key, so this action is reachable by anyone with the page
// open. The cooldown keeps it from being looped to bury someone's inbox.
// It's per instance rather than shared state, which is enough to stop the
// obvious abuse without putting a table in the way of a password reset.
const lastSentAt = new Map<string, number>();

function onCooldown(email: string, now: number) {
  const previous = lastSentAt.get(email);
  if (previous && now - previous < COOLDOWN_MS) return true;

  // Cheap sweep so a long-lived instance doesn't hold every address that
  // ever asked for a reset.
  lastSentAt.forEach((at, key) => {
    if (now - at >= COOLDOWN_MS) lastSentAt.delete(key);
  });

  lastSentAt.set(email, now);
  return false;
}

/**
 * Always resolves the same way for an unknown address as for a real one —
 * the page must not become a way to check who has an account here. The
 * boolean only reports whether *our* side broke (Resend down, config
 * missing), so the form can offer a retry instead of claiming success.
 */
export async function requestPasswordReset(email: string): Promise<{ ok: boolean }> {
  const address = email.trim().toLowerCase();
  if (!address || !address.includes("@")) return { ok: true };

  if (onCooldown(address, Date.now())) return { ok: true };

  const sent = await sendPasswordResetEmail(address);
  return { ok: sent };
}
