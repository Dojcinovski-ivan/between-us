import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles the redirect back from an OAuth provider (Google). Must be a
// Route Handler, not a page, since exchanging the code for a session
// needs to set the session cookie, same reason /auth/confirm exists
// separately for the email OTP flow.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

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
        return NextResponse.redirect(new URL(destination, origin));
      }
    }
  }

  return NextResponse.redirect(new URL("/auth/confirm-error", origin));
}
