import "server-only";
import type { User } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * The signed-in user behind an /api/mobile request, or null.
 *
 * The iOS app has no cookies, so it sends its Supabase access token as
 * `Authorization: Bearer <token>`. auth.getUser(token) asks Supabase Auth
 * to validate it (signature, expiry, and that the user still exists and
 * isn't banned), so a forged or stale token never gets through.
 */
export async function getMobileUser(request: Request): Promise<User | null> {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const { data, error } = await createAdminClient().auth.getUser(match[1]);
  if (error || !data.user) return null;
  return data.user;
}
