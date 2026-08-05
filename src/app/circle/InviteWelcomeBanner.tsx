"use client";

import { useEffect, useState } from "react";

const DISMISSED_KEY = "invite_welcome_dismissed";

function hasJustInvitedCookie() {
  return document.cookie.split("; ").some((c) => c.startsWith("just_invited="));
}

function clearJustInvitedCookie() {
  document.cookie = "just_invited=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

// Shown once, right after an invited member finishes onboarding and
// lands in a circle that already has posts waiting for them. The
// just_invited cookie is a short lived, one time signal set by
// completeInviteOnboarding, read here and cleared immediately so a
// page refresh never shows it again even before the dismiss button is
// used, and the localStorage flag makes the dismissal permanent.
export function InviteWelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISSED_KEY) === "1";
    if (!dismissed && hasJustInvitedCookie()) {
      setVisible(true);
      clearJustInvitedCookie();
    }
  }, []);

  function dismiss() {
    localStorage.setItem(DISMISSED_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="mb-6 flex items-start justify-between gap-3 rounded-2xl border border-sage/40 bg-sage-soft px-4 py-3">
      <p className="text-sm leading-relaxed text-ink">
        Welcome to your circle. This is a safe space to explore and share. Feel free to read, react, or post
        whenever you feel ready.
      </p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 text-muted hover:text-ink"
      >
        ✕
      </button>
    </div>
  );
}
