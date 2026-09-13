import { PROTECTED_PATHS } from "@/lib/protectedPaths";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    twq?: (...args: unknown[]) => void;
    __betweenUsPixelPath?: string;
  }
}

// X identifies a conversion by an opaque ID minted in Events Manager
// rather than by a standard name the way Meta does, so the IDs live here
// instead of at each call site. Public identifiers, same reasoning as the
// pixel IDs themselves, with env overrides so they can be repointed
// without a deploy.
export const X_EVENTS = {
  // Fires on /register the moment the account is created. Counts everyone
  // who signed up, including those who never finish onboarding.
  signUp: process.env.NEXT_PUBLIC_X_EVENT_SIGN_UP ?? "tw-rf8km-rf8kz",
  // Created in Events Manager but not fired yet. Joining a circle happens
  // on /onboarding, a protected path where no pixel is mounted, so this
  // needs either X's conversion API or a decision to run the pixel there.
  joinedCircle: process.env.NEXT_PUBLIC_X_EVENT_JOINED_CIRCLE ?? "tw-rf8km-rf8l1",
} as const;

// fbq only exists once MetaPixel has mounted, and MetaPixel only mounts
// once analytics consent has been given. Everything here is therefore a
// no-op without consent, and no caller has to check for it.
function pixelReady(): boolean {
  return typeof window !== "undefined" && typeof window.fbq === "function";
}

// The last path counted, parked on window rather than in a React ref
// because MetaPixel remounts on navigation — a ref resets with it, which
// silently dropped the PageView for every route after the first.
export function trackPageView(pathname: string | null) {
  if (!pathname) return;

  // Never from inside the logged in app. These are private support
  // circles, and which one someone is reading is not something to hand
  // to an ad network.
  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) return;

  // Script hasn't executed yet — MetaPixel's onReady fires this instead.
  // Bailing out before the path is recorded is what makes that safe.
  if (!pixelReady()) return;

  if (window.__betweenUsPixelPath === pathname) return;
  window.__betweenUsPixelPath = pathname;

  window.fbq!("track", "PageView");
}

/**
 * Fires a standard Meta event, e.g. "Lead" when someone registers.
 *
 * Deliberately takes no custom parameters. Anything we could attach here
 * — email, category of experience, circle — is exactly the kind of thing
 * this app exists to keep private, so events carry the fact that
 * something happened and nothing about who it happened to.
 */
export function trackPixelEvent(event: string) {
  if (!pixelReady()) return;
  window.fbq!("track", event);
}

// twq only exists once XPixel has mounted, and XPixel only mounts once
// analytics consent has been given, so this is a no-op without consent in
// exactly the same way fbq is.
function xPixelReady(): boolean {
  return typeof window !== "undefined" && typeof window.twq === "function";
}

/**
 * Fires an X conversion event by its event ID.
 *
 * Sends an empty parameter object on purpose. X offers email address and
 * phone number as optional event parameters, and neither is something
 * this app hands to an ad network, for the same reason trackPixelEvent
 * attaches nothing: the event carries that something happened, and
 * nothing about who it happened to.
 */
export function trackXEvent(eventId: string) {
  if (!xPixelReady()) return;
  window.twq!("event", eventId, {});
}
