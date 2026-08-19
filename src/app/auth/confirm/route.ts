import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the Supabase email confirmation callback (signup, magic link,
// recovery, etc.). Must be a Route Handler, not a page — verifying the
// OTP needs to set the session cookie, which only works here or in a
// Server Action, not during a Server Component render.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  // Signup confirmations carry the invite token so an invited account
  // still lands in the right circle when the email is opened on a device
  // that never saw the /invite cookie.
  const inviteToken = searchParams.get("invite");

  if (tokenHash && type) {
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("circle_id")
          .eq("id", user.id)
          .maybeSingle();

        const destination = profile?.circle_id ? "/circle" : "/onboarding";
        const response = NextResponse.redirect(new URL(destination, origin));

        if (inviteToken) {
          // Same shape as the cookie /invite sets, so onboarding cannot
          // tell the two paths apart. Short lived: onboarding is the very
          // next step from here.
          response.cookies.set("invite_token", inviteToken, {
            path: "/",
            maxAge: 60 * 60,
            httpOnly: true,
            sameSite: "lax",
          });
        }

        return response;
      }
    }
  }

  return NextResponse.redirect(new URL("/auth/confirm-error", origin));
}
