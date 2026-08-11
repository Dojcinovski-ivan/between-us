"use server";

import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/unsubscribeToken";

export async function confirmUnsubscribe(formData: FormData) {
  const userId = String(formData.get("u") ?? "");
  const token = String(formData.get("t") ?? "");

  // Re-validated here rather than trusted from the page render, since a
  // form POST is a fresh request an attacker could forge directly.
  if (!userId || !verifyUnsubscribeToken(userId, token)) {
    redirect("/unsubscribe?invalid=1");
  }

  const admin = createAdminClient();
  await admin
    .from("users")
    .update({ email_marketing_consent: false, email_marketing_consent_date: null })
    .eq("id", userId);

  redirect("/unsubscribe?done=1");
}
