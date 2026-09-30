import { NextRequest, NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobileAuth";
import { eraseAccountFor } from "@/lib/account";

// In-app account deletion, which the App Store requires (guideline
// 5.1.1(v)). Same irreversible anonymisation as the website. The app
// signs itself out afterwards; the login is banned server side anyway.
export async function POST(request: NextRequest) {
  const user = await getMobileUser(request);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await eraseAccountFor(user.id);
  return NextResponse.json(result, { status: result.ok ? 200 : 502 });
}
