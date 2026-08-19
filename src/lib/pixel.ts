import { PROTECTED_PATHS } from "@/lib/protectedPaths";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    __betweenUsPixelPath?: string;
  }
}

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
