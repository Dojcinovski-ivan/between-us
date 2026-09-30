import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendReportNotification } from "@/lib/email";

/**
 * Shared by the web notifyReportSubmitted action and
 * /api/mobile/reports. Emails the team about a report the caller filed.
 *
 * Checked against the report's own reporter, so nobody can point this at
 * someone else's report id and trigger emails with it.
 */
export async function notifyReportFor(userId: string, reportId: string): Promise<void> {
  const { data: report } = await createAdminClient()
    .from("reports")
    .select("reported_by")
    .eq("id", reportId)
    .maybeSingle();

  if (!report || report.reported_by !== userId) return;
  await sendReportNotification(reportId);
}
