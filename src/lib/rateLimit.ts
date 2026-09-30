import "server-only";
import { createHash } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";

// Keys are hashed so the rate_limit_events table never stores an email or
// IP address in the clear. The prefix keeps different limits apart.
function hashKey(scope: string, value: string) {
  return `${scope}:${createHash("sha256").update(value).digest("hex")}`;
}

/**
 * Records one attempt and returns whether it is allowed. Backed by
 * public.check_rate_limit (migration 0029) so every server instance shares
 * the same counts.
 *
 * Fails open: if the database call itself breaks, the attempt is allowed
 * and the error logged. A broken limiter must not lock everyone out of
 * signing up or resetting a password.
 */
export async function checkRateLimit(
  scope: string,
  value: string,
  max: number,
  windowSeconds: number,
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin.rpc("check_rate_limit", {
      p_key: hashKey(scope, value),
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) {
      console.error("[rate-limit] check failed:", error);
      return true;
    }
    return data === true;
  } catch (err) {
    console.error("[rate-limit] check failed:", err);
    return true;
  }
}

/**
 * The caller's IP as Vercel reports it. The first x-forwarded-for entry is
 * the client; later ones are proxies.
 */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || headers.get("x-real-ip") || "unknown";
}
