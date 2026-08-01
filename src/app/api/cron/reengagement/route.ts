import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReengagementEmail } from "@/lib/email";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Inactive for at least 7 days, and either never sent a re-engagement
  // email or the last one was itself at least 7 days ago, so someone who
  // stays away does not get emailed every single day this job runs.
  const { data: candidates } = await admin
    .from("users")
    .select("id")
    .eq("email_marketing_consent", true)
    .not("circle_id", "is", null)
    .lte("last_active_at", sevenDaysAgo)
    .or(`last_reengagement_email_at.is.null,last_reengagement_email_at.lte.${sevenDaysAgo}`);

  await Promise.allSettled((candidates ?? []).map((user) => sendReengagementEmail(user.id)));

  return NextResponse.json({ ok: true, sent: candidates?.length ?? 0 });
}
