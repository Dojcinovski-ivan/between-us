"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GoogleAnalytics } from "@next/third-parties/google";
import { PROTECTED_PATHS } from "@/lib/protectedPaths";
import { MetaPixel } from "./MetaPixel";

const COOKIE_NAME = "analytics_consent";
const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Fired by the "Cookie settings" footer link so this component (mounted
// once in the root layout) can reopen the banner without a full page
// reload, from wherever in the tree that link happens to render.
export const REOPEN_COOKIE_BANNER_EVENT = "reopen-cookie-banner";

function readConsentCookie(): "true" | "false" | null {
  const match = document.cookie.match(/(?:^|; )analytics_consent=([^;]*)/);
  if (!match) return null;
  return match[1] === "true" ? "true" : match[1] === "false" ? "false" : null;
}

function writeConsentCookie(value: "true" | "false") {
  const oneYear = 60 * 60 * 24 * 365;
  document.cookie = `${COOKIE_NAME}=${value}; path=/; max-age=${oneYear}; SameSite=Lax`;
}

export function CookieConsent() {
  const pathname = usePathname();
  const [consent, setConsent] = useState<"true" | "false" | "unset" | null>(null);

  useEffect(() => {
    setConsent(readConsentCookie() ?? "unset");

    function handleReopen() {
      setConsent("unset");
    }
    window.addEventListener(REOPEN_COOKIE_BANNER_EVENT, handleReopen);
    return () => window.removeEventListener(REOPEN_COOKIE_BANNER_EVENT, handleReopen);
  }, []);

  function handleAccept() {
    writeConsentCookie("true");
    setConsent("true");
  }

  function handleDecline() {
    writeConsentCookie("false");
    setConsent("false");
  }

  const isProtectedPage = PROTECTED_PATHS.some((path) => pathname?.startsWith(path));
  const showBanner = consent === "unset" && !isProtectedPage;

  return (
    <>
      {consent === "true" && GA_ID && <GoogleAnalytics gaId={GA_ID} />}

      {/* Held back on the logged in pages, unlike GA. An ad network
          knowing someone is reading a particular support circle is a
          different thing from counting how people find the site. */}
      {consent === "true" && !isProtectedPage && <MetaPixel />}

      {showBanner && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg px-4 py-5 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] sm:px-6">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <p className="text-sm leading-relaxed text-ink">
              We use cookies to understand how people find and use Between
              Us. This helps us improve the experience for everyone.
            </p>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <button
                type="button"
                onClick={handleAccept}
                className="w-full rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-text hover:bg-accent-hover sm:w-auto"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={handleDecline}
                className="w-full rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface2 sm:w-auto"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
