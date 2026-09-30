import { NextRequest, NextResponse } from "next/server";
import { requestPasswordResetFor } from "@/lib/passwordReset";
import { clientIp } from "@/lib/rateLimit";

// Called by the iOS app before anyone is signed in, so there is no token to
// verify here; the rate limits inside requestPasswordResetFor are the guard.
// Same response for known and unknown addresses, same as the web form.
export async function POST(request: NextRequest) {
  let email = "";
  try {
    const body = await request.json();
    if (typeof body?.email === "string") email = body.email;
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const { ok } = await requestPasswordResetFor(email, clientIp(request.headers));
  return NextResponse.json({ ok }, { status: ok ? 200 : 502 });
}
