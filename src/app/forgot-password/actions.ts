"use server";

import { headers } from "next/headers";
import { requestPasswordResetFor } from "@/lib/passwordReset";
import { clientIp } from "@/lib/rateLimit";

// Sending happens server side because minting the recovery link needs the
// service role key. The logic and its rate limits live in passwordReset.ts,
// shared with the iOS app's /api/mobile/forgot-password route.
export async function requestPasswordReset(email: string): Promise<{ ok: boolean }> {
  return requestPasswordResetFor(email, clientIp(headers()));
}
