"use server";

import { randomBytes } from "crypto";
import { headers } from "next/headers";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAdminCircles } from "@/lib/adminCircles";
import type { AdminCircleData } from "@/lib/circleActivity";
import { SPARK_MAX_LENGTH } from "@/lib/circleSparks";

// Server actions behind the admin Circles tab. Every one of them re-checks
// is_admin against the caller's own session before doing anything: a server
// action is a plain request anyone can shape, so the tab being hidden in
// the UI is not a control.
//
// The writes here all go through the service role, because both new tables
// are deliberately closed to client writes (see 0024_admin_circle_seeding).

// Matches the pattern onboarding enforces, so a seeded account can never
// carry a name a real member could not have chosen for themselves.
const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

const SEED_EMAIL_DOMAIN = "betweenussupport.com";
const SEED_EMAIL_LOCAL = "between_us_team";

async function requireAdmin() {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile?.is_admin) return null;
  return user;
}

// The magic link has to point at whichever origin the admin is actually
// using, so a link minted while running locally opens localhost and one
// minted in production opens the live site. NEXT_PUBLIC_SITE_URL is only
// the fallback, since locally it is still set to the production domain.
function currentOrigin() {
  const h = headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) {
    const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? `https://${SEED_EMAIL_DOMAIN}`;
}

export async function loadCircles(): Promise<AdminCircleData | { error: string }> {
  if (!(await requireAdmin())) return { error: "Not allowed." };
  try {
    return await getAdminCircles();
  } catch {
    return { error: "Could not load the circles. Please try again." };
  }
}

// Mints a one time link that signs the browser that opens it in as the
// given account. /auth/confirm already handles the magiclink type, so this
// reuses the exact path a normal member's email link takes.
async function mintMagicLink(admin: ReturnType<typeof createAdminClient>, email: string) {
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = data?.properties?.hashed_token;
  if (error || !tokenHash) return null;
  const params = new URLSearchParams({ token_hash: tokenHash, type: "magiclink" });
  return `${currentOrigin()}/auth/confirm?${params.toString()}`;
}

export type SeededMemberResult =
  | { error: string }
  | { username: string; email: string; password: string; magicLink: string | null };

/**
 * Creates an ordinary looking member account and drops it into a circle.
 *
 * Deliberately does NOT go through matchCircle: that picks its own circle,
 * publishes a waiting member's draft, and is what the onboarding flow uses
 * to decide which circle formed and new member emails to send. Seeding a
 * chosen circle must do none of that, so the two writes it does need
 * (the profile row and the member count) are done directly here.
 */
export async function createSeededMember(input: {
  circleId: string;
  username: string;
}): Promise<SeededMemberResult> {
  if (!(await requireAdmin())) return { error: "Not allowed." };

  const username = input.username.trim();
  if (!USERNAME_PATTERN.test(username)) {
    return { error: "Names are 3 to 20 characters: letters, numbers and underscores only." };
  }

  const admin = createAdminClient();

  const { data: circle } = await admin
    .from("circles")
    .select("id, category, member_count")
    .eq("id", input.circleId)
    .maybeSingle();

  if (!circle) return { error: "That circle no longer exists." };

  // Circles have no slug of their own, and several circles share one
  // category, so the address is the category plus a slice of the circle id.
  // A second seeded account in the same circle takes the username too,
  // since one address can only ever belong to one account.
  const base = `${SEED_EMAIL_LOCAL}+${circle.category}_${circle.id.slice(0, 8)}`;
  const candidates = [`${base}@${SEED_EMAIL_DOMAIN}`, `${base}_${username}@${SEED_EMAIL_DOMAIN}`];

  // Shown once, so the admin can sign back in as this member later from any
  // browser without having to mint a fresh link every time.
  const password = randomBytes(18).toString("base64url");

  let email: string | null = null;
  let userId: string | null = null;
  let lastError = "";

  for (const candidate of candidates) {
    const { data, error } = await admin.auth.admin.createUser({
      email: candidate,
      password,
      // Confirmed on the spot so no mail is ever sent to this address and
      // the account is usable immediately.
      email_confirm: true,
    });
    if (data?.user) {
      email = candidate;
      userId = data.user.id;
      break;
    }
    lastError = error?.message ?? "";
  }

  if (!email || !userId) {
    return {
      error: lastError
        ? "Could not create that account. Both seeded addresses for this circle are already taken."
        : "Could not create that account. Please try again.",
    };
  }

  const { error: profileError } = await admin.from("users").insert({
    id: userId,
    username,
    // The circle's own category, so the weekly prompt, daily question and
    // circle name all line up for this account exactly as for a real member.
    category: circle.category,
    circle_id: circle.id,
    // Never true. This is the rule that keeps a seeded account looking like
    // an ordinary member everywhere in the app.
    is_admin: false,
    // Keeps the re-engagement and weekly digest crons from ever mailing
    // this address, both of which select on this column.
    email_marketing_consent: false,
  });

  if (profileError) {
    // Leave nothing half made behind: without a profile row the auth user
    // is unusable, and it would block the address on the next attempt.
    await admin.auth.admin.deleteUser(userId);
    if (profileError.code === "23505") {
      return { error: "That name is already taken. Try another one." };
    }
    return { error: "Could not create that member. Please try again." };
  }

  const { error: recordError } = await admin.from("admin_circle_accounts").insert({
    user_id: userId,
    circle_id: circle.id,
    username,
  });

  if (recordError) {
    // Without this row nobody can tell later that the account was seeded,
    // which is worse than not having created it at all.
    await admin.from("users").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
    return { error: "Could not record that seeded account. Nothing was created." };
  }

  // Same single write matchCircle makes, so the feed header, the waiting
  // room threshold and the members panel all agree the circle grew.
  await admin
    .from("circles")
    .update({ member_count: (circle.member_count ?? 0) + 1 })
    .eq("id", circle.id);

  const magicLink = await mintMagicLink(admin, email);

  return { username, email, password, magicLink };
}

// A fresh link for an account created earlier. Magic links are one time and
// short lived, so re-opening a seeded member later needs a new one.
export async function openAsMember(userId: string): Promise<{ magicLink: string } | { error: string }> {
  if (!(await requireAdmin())) return { error: "Not allowed." };

  const admin = createAdminClient();

  // Scoped through admin_circle_accounts on purpose: this can only ever
  // mint a link for an account the team seeded, never for a real member.
  const { data: seeded } = await admin
    .from("admin_circle_accounts")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (!seeded) return { error: "That is not a seeded account." };

  const { data } = await admin.auth.admin.getUserById(userId);
  const email = data.user?.email;
  if (!email) return { error: "That account has no email address." };

  const magicLink = await mintMagicLink(admin, email);
  if (!magicLink) return { error: "Could not create a link right now. Please try again." };

  return { magicLink };
}

export type SeededAccount = { userId: string; username: string };

export async function listSeededMembers(circleId: string): Promise<SeededAccount[]> {
  if (!(await requireAdmin())) return [];
  const admin = createAdminClient();
  const { data } = await admin
    .from("admin_circle_accounts")
    .select("user_id, username")
    .eq("circle_id", circleId)
    .order("created_at", { ascending: true });
  return (data ?? []).map((r) => ({ userId: r.user_id, username: r.username }));
}

export async function sendSpark(input: {
  circleId: string;
  content: string;
}): Promise<{ expiresAt: string } | { error: string }> {
  if (!(await requireAdmin())) return { error: "Not allowed." };

  const content = input.content.trim();
  if (!content) return { error: "Please choose a spark or write one." };
  if (content.length > SPARK_MAX_LENGTH) {
    return { error: `Sparks are up to ${SPARK_MAX_LENGTH} characters.` };
  }

  const admin = createAdminClient();

  const { data: circle } = await admin
    .from("circles")
    .select("id")
    .eq("id", input.circleId)
    .maybeSingle();

  if (!circle) return { error: "That circle no longer exists." };

  // expires_at is left to the column default, so the 48 hour window is set
  // by the database rather than by whatever clock this server happens to be on.
  const { data, error } = await admin
    .from("circle_sparks")
    .insert({ circle_id: circle.id, content, created_by_admin: true })
    .select("expires_at")
    .single();

  if (error || !data) return { error: "Could not send that spark. Please try again." };

  return { expiresAt: data.expires_at as string };
}
