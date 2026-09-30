import { NextRequest, NextResponse } from "next/server";
import { registerAccountFor } from "@/lib/registration";
import { clientIp } from "@/lib/rateLimit";

// Called by the iOS app before an account exists, so there is no token to
// verify; the rate limits inside registerAccountFor are the guard. Invite
// links are web only for now, so no invite token is passed.
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const dob = (body.dateOfBirth ?? {}) as Record<string, unknown>;
  const status = await registerAccountFor(
    {
      email: String(body.email ?? ""),
      password: String(body.password ?? ""),
      marketingConsent: body.marketingConsent === true,
      ageConfirmation: { day: Number(dob.day), month: Number(dob.month), year: Number(dob.year) },
    },
    { ip: clientIp(request.headers) },
  );

  // Every outcome is a normal answer the app shows a message for, so all
  // of them are 200 except our own failure and the rate limit.
  const httpStatus = status === "failed" ? 502 : status === "rate_limited" ? 429 : 200;
  return NextResponse.json({ status }, { status: httpStatus });
}
