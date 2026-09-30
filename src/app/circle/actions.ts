"use server";

import { getCurrentUserAndProfile } from "@/lib/auth";
import { notifyReportFor } from "@/lib/reports";

// The logic lives in reports.ts, shared with the iOS app's
// /api/mobile/reports route.
export async function notifyReportSubmitted(reportId: string) {
  const { user } = await getCurrentUserAndProfile();
  if (!user) return;
  await notifyReportFor(user.id, reportId);
}
