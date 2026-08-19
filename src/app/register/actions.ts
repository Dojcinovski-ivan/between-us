"use server";

import { cookies } from "next/headers";
import { sendSignupConfirmationEmail, type SignupResult } from "@/lib/email";

/**
 * Creates the account server side so the confirmation email can come from
 * Between Us rather than Supabase — minting the token needs the service
 * role key. The account is unconfirmed until the emailed link is opened.
 */
export async function registerAccount(input: {
  email: string;
  password: string;
  marketingConsent: boolean;
}): Promise<{ status: SignupResult }> {
  const email = input.email.trim().toLowerCase();

  // Re-checked here rather than trusted from the form, since a server
  // action is a plain request anyone can shape.
  if (!email.includes("@") || input.password.length < 8) {
    return { status: "failed" };
  }

  // Read straight off the cookie the /invite route set — the browser
  // still has it at this point, and it never has to round trip through
  // the client.
  const inviteToken = cookies().get("invite_token")?.value;

  const status = await sendSignupConfirmationEmail({
    email,
    password: input.password,
    marketingConsent: input.marketingConsent,
    inviteToken,
  });

  return { status };
}
