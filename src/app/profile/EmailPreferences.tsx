"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function EmailPreferences({
  userId,
  initialConsent,
}: {
  userId: string;
  initialConsent: boolean;
}) {
  const supabase = createClient();
  const [consent, setConsent] = useState(initialConsent);
  const [isSaving, setIsSaving] = useState(false);

  async function handleToggle(next: boolean) {
    setConsent(next);
    setIsSaving(true);
    await supabase
      .from("users")
      .update({
        email_marketing_consent: next,
        email_marketing_consent_date: next ? new Date().toISOString() : null,
      })
      .eq("id", userId);
    setIsSaving(false);
  }

  return (
    <div>
      <p className="text-sm font-medium text-muted">Email preferences</p>
      <label className="mt-2 flex items-start gap-2.5">
        <input
          type="checkbox"
          checked={consent}
          disabled={isSaving}
          onChange={(e) => handleToggle(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-sage focus:ring-sage"
        />
        <span className="text-sm leading-relaxed text-ink">
          Receive circle updates and news from Between Us by email
        </span>
      </label>
    </div>
  );
}
