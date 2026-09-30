import "server-only";
import { sendSignupConfirmationEmail, type SignupResult } from "@/lib/email";
import { isOldEnough } from "@/lib/age";
import { checkRateLimit } from "@/lib/rateLimit";

export type RegistrationInput = {
  email: string;
  password: string;
  marketingConsent: boolean;
  ageConfirmation: { day: number; month: number; year: number };
};

/**
 * Shared by the web register action and /api/mobile/register.
 *
 * Creates the account server side so the confirmation email can come from
 * Between Us rather than Supabase — minting the token needs the service
 * role key. The account is unconfirmed until the emailed link is opened.
 *
 * Everything is re-checked here rather than trusted from the form, since
 * both callers are plain requests anyone can shape.
 *
 * Limits: 5 attempts per IP per hour, so one caller can't mass-create
 * accounts or mail-bomb a list of addresses, and 3 per address per hour,
 * so one inbox can't be flooded with confirmation emails.
 */
export async function registerAccountFor(
  input: RegistrationInput,
  { ip, inviteToken }: { ip: string; inviteToken?: string },
): Promise<SignupResult> {
  const email = String(input.email ?? "").trim().toLowerCase();
  const password = String(input.password ?? "");

  if (!email.includes("@") || password.length < 8) return "failed";

  if (!(await checkRateLimit("register-ip", ip, 5, 60 * 60))) return "rate_limited";

  // A check that only runs in the browser or app is not a gate, it is a
  // suggestion. The date is used here and then dropped: only the fact that
  // it passed is carried forward.
  const { day, month, year } = input.ageConfirmation ?? {};
  if (!isOldEnough(Number(day), Number(month), Number(year))) return "underage";

  if (!(await checkRateLimit("register-email", email, 3, 60 * 60))) return "rate_limited";

  return sendSignupConfirmationEmail({
    email,
    password,
    marketingConsent: input.marketingConsent === true,
    inviteToken,
  });
}
