import { NextRequest, NextResponse } from "next/server";
import { getMobileUser } from "@/lib/mobileAuth";
import { notifyReportFor } from "@/lib/reports";

// The app files the report itself (reports allows inserts under RLS), then
// calls this so the team is emailed, same as the web PostMenu does.
export async function POST(request: NextRequest) {
  const user = await getMobileUser(request);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let reportId = "";
  try {
    const body = await request.json();
    if (typeof body?.reportId === "string") reportId = body.reportId;
  } catch {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  await notifyReportFor(user.id, reportId);
  return NextResponse.json({ ok: true });
}
