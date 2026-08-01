"use client";

import { REOPEN_COOKIE_BANNER_EVENT } from "./CookieConsent";

export function CookieSettingsLink({ className }: { className?: string }) {
  function handleClick() {
    document.cookie = "analytics_consent=; path=/; max-age=0";
    window.dispatchEvent(new Event(REOPEN_COOKIE_BANNER_EVENT));
  }

  return (
    <button type="button" onClick={handleClick} className={className}>
      Cookie settings
    </button>
  );
}
