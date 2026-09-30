import { NextRequest, NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobileAuth";
import { exportDataFor } from "@/lib/account";

// Everything Between Us holds about the caller, as the same JSON the
// website's "Download my data" gives.
export async function GET(request: NextRequest) {
  const user = await getMobileUser(request);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const result = await exportDataFor(user.id);
  if (!result.ok || !result.data) {
    return NextResponse.json({ error: result.error ?? "failed" }, { status: 502 });
  }
  return new NextResponse(result.data, {
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
