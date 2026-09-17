// Cookie consent, split by purpose.
//
// It used to be one Accept that switched on Google Analytics, the Meta
// Pixel and the X Pixel together, under banner copy that only mentioned
// understanding how people find the site. Consent has to be specific and
// informed per purpose, and "measure our traffic" and "let two ad networks
// build an audience" are not the same purpose. So there are two now, and
// declining one does not decline the other.

export type ConsentPurpose = "analytics" | "advertising";

export const CONSENT_COOKIES: Record<ConsentPurpose, string> = {
  // Kept as the original name so anyone who already chose does not get
  // asked again about the thing they already answered.
  analytics: "analytics_consent",
  advertising: "advertising_consent",
};

export const CONSENT_MAX_AGE = 60 * 60 * 24 * 365;

export function readConsent(purpose: ConsentPurpose): boolean | null {
  if (typeof document === "undefined") return null;
  const name = CONSENT_COOKIES[purpose];
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  if (!match) return null;
  return match[1] === "true" ? true : match[1] === "false" ? false : null;
}

export function writeConsent(purpose: ConsentPurpose, value: boolean) {
  document.cookie = `${CONSENT_COOKIES[purpose]}=${value}; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax`;
}

// Pages where an advertising pixel must never load, on top of the logged
// in paths it already stays off.
//
// /register is the sharp edge. A Meta or X tag firing there tells an ad
// network that this browser signed up to a service for people recovering
// from addiction and abuse, which is an inference about someone's health
// whatever the event payload does or does not carry. /login is the same
// signal for people coming back.
export const NO_ADVERTISING_PATHS = [
  "/register",
  "/login",
  "/forgot-password",
  "/reset-password",
  "/auth",
  "/invite",
  "/unsubscribe",
];
