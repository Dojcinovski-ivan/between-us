import { NextRequest, NextResponse } from "next/server";
import { sendWeeklyDigest } from "@/lib/email";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await sendWeeklyDigest();

  return NextResponse.json({ ok: true });
}
