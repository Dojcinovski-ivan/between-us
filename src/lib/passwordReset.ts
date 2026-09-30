import "server-only";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";

/**
 * Shared by the web forgot-password action and /api/mobile/forgot-password.
 *
 * Always resolves the same way for an unknown address as for a real one —
 * this must not become a way to check who has an account here. The boolean
 * only reports whether *our* side broke (Resend down, config missing), so
 * the form can offer a retry instead of claiming success.
 *
 * Two limits, both silent: one email per address per minute, so it can't
 * be looped to bury someone's inbox, and 10 requests per IP per hour, so
 * one caller can't walk a list of addresses.
 */
export async function requestPasswordResetFor(email: string, ip: string): Promise<{ ok: boolean }> {
  const address = email.trim().toLowerCase();
  if (!address || !address.includes("@")) return { ok: true };

  if (!(await checkRateLimit("reset-ip", ip, 10, 60 * 60))) return { ok: true };
  if (!(await checkRateLimit("reset-email", address, 1, 60))) return { ok: true };

  const sent = await sendPasswordResetEmail(address);
  return { ok: sent };
}
