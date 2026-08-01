"use server";

import { sendReportNotification } from "@/lib/email";

export async function notifyReportSubmitted(reportId: string) {
  await sendReportNotification(reportId);
}
