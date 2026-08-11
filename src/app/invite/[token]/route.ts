import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const INVITE_COOKIE_MAX_AGE = 60 * 60 * 24; // 1 day, long enough to cover registration and onboarding

// Entry point for a shared invite link. Looks up the token, remembers it
// in a cookie so the rest of the signup path can find it again, then
// sends the visitor to whichever step they actually need next. Never
// touches the normal onboarding flow for anyone who arrives without a
// token.
export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  const { origin } = new URL(request.url);
  const admin = createAdminClient();

  const { data: invite } = await admin
    .from("invite_links")
    .select("id, circle_id, expires_at, max_uses, use_count")
    .eq("token", params.token)
    .maybeSingle();

  const isValid =
    !!invite &&
    new Date(invite.expires_at).getTime() > Date.now() &&
    invite.use_count < invite.max_uses;

  if (!isValid) {
    return NextResponse.redirect(new URL("/login?invite=invalid", origin));
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let destination = "/register";
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("circle_id")
      .eq("id", user.id)
      .maybeSingle();
    destination = profile?.circle_id ? "/circle" : "/onboarding";
  }

  const response = NextResponse.redirect(new URL(destination, origin));
  response.cookies.set("invite_token", params.token, {
    path: "/",
    maxAge: INVITE_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
  });
  return response;
}
