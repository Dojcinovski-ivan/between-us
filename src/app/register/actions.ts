"use server";

import { cookies, headers } from "next/headers";
import { type SignupResult } from "@/lib/email";
import { registerAccountFor, type RegistrationInput } from "@/lib/registration";
import { clientIp } from "@/lib/rateLimit";

// The logic and its rate limits live in registration.ts, shared with the
// iOS app's /api/mobile/register route.
export async function registerAccount(input: RegistrationInput): Promise<{ status: SignupResult }> {
  // Read straight off the cookie the /invite route set — the browser
  // still has it at this point, and it never has to round trip through
  // the client.
  const inviteToken = cookies().get("invite_token")?.value;

  const status = await registerAccountFor(input, { ip: clientIp(headers()), inviteToken });
  return { status };
}
