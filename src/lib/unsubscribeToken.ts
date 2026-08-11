import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

// Signed with the service role key rather than a dedicated secret, since
// it's already a private, server-only value guaranteed to be set in every
// environment that can send email — no extra config needed before this
// works in production.
function secret() {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

export function signUnsubscribeToken(userId: string) {
  return createHmac("sha256", secret()).update(userId).digest("hex");
}

export function verifyUnsubscribeToken(userId: string, token: string | undefined) {
  if (!token) return false;
  const expected = Buffer.from(signUnsubscribeToken(userId));
  const actual = Buffer.from(token);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
