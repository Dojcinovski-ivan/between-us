"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { GoogleAnalytics } from "@next/third-parties/google";
import { PROTECTED_PATHS } from "@/lib/protectedPaths";
import { NO_ADVERTISING_PATHS, readConsent, writeConsent } from "@/lib/consent";
import { MetaPixel } from "./MetaPixel";
import { XPixel } from "./XPixel";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Fired by the "Cookie settings" footer link so this component (mounted
// once in the root layout) can reopen the banner without a full page
// reload, from wherever in the tree that link happens to render.
export const REOPEN_COOKIE_BANNER_EVENT = "reopen-cookie-banner";

type Decision = { analytics: boolean; advertising: boolean } | "unset" | null;

export function CookieConsent() {
  const pathname = usePathname();
  const [decision, setDecision] = useState<Decision>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [wantAnalytics, setWantAnalytics] = useState(false);
  const [wantAdvertising, setWantAdvertising] = useState(false);

  useEffect(() => {
    const analytics = readConsent("analytics");
    const advertising = readConsent("advertising");

    // Anyone who answered the old single question answered it about
    // analytics. Advertising is a purpose they were never actually asked
    // about, so it stays off and unanswered rather than being inferred
    // from a click that meant something narrower.
    if (analytics === null) {
      setDecision("unset");
    } else if (advertising === null) {
      setWantAnalytics(analytics);
      setDecision("unset");
    } else {
      setDecision({ analytics, advertising });
    }

    function handleReopen() {
      setWantAnalytics(readConsent("analytics") ?? false);
      setWantAdvertising(readConsent("advertising") ?? false);
      setShowDetail(true);
      setDecision("unset");
    }
    window.addEventListener(REOPEN_COOKIE_BANNER_EVENT, handleReopen);
    return () => window.removeEventListener(REOPEN_COOKIE_BANNER_EVENT, handleReopen);
  }, []);

  function save(analytics: boolean, advertising: boolean) {
    writeConsent("analytics", analytics);
    writeConsent("advertising", advertising);
    setDecision({ analytics, advertising });
    setShowDetail(false);
  }

  const isProtectedPage = PROTECTED_PATHS.some((path) => pathname?.startsWith(path));
  const isNoAdvertisingPage = NO_ADVERTISING_PATHS.some((path) => pathname?.startsWith(path));
  const showBanner = decision === "unset" && !isProtectedPage;

  const granted = decision !== null && decision !== "unset" ? decision : null;

  return (
    <>
      {granted?.analytics && GA_ID && <GoogleAnalytics gaId={GA_ID} />}

      {/* Advertising tags stay off inside the logged in app, and off the
          pages where simply being present says something about the
          person's health. See NO_ADVERTISING_PATHS. */}
      {granted?.advertising && !isProtectedPage && !isNoAdvertisingPage && <MetaPixel />}
      {granted?.advertising && !isProtectedPage && !isNoAdvertisingPage && <XPixel />}

      {showBanner && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-bg px-4 py-5 shadow-[0_-4px_20px_rgba(0,0,0,0.12)] sm:px-6">
          <div className="mx-auto w-full max-w-4xl">
            {!showDetail ? (
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                <p className="text-sm leading-relaxed text-ink">
                  We use cookies to measure how the site is doing, and
                  optionally to see which ads brought people here. You can
                  choose each separately, and nothing loads until you do.{" "}
                  <Link href="/privacy" className="underline underline-offset-4">
                    Read more
                  </Link>
                  .
                </p>
                <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                  <button
                    type="button"
                    onClick={() => save(true, true)}
                    className="w-full rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-text hover:bg-accent-hover sm:w-auto"
                  >
                    Accept all
                  </button>
                  <button
                    type="button"
                    onClick={() => save(false, false)}
                    className="w-full rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface2 sm:w-auto"
                  >
                    Reject all
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDetail(true)}
                    className="w-full rounded-full px-5 py-2.5 text-sm font-medium text-muted hover:text-ink sm:w-auto"
                  >
                    Choose
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-3">
                  <label className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked
                      disabled
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
                    />
                    <span className="text-sm leading-relaxed text-muted">
                      <span className="font-medium text-ink">Essential.</span>{" "}
                      Keeps you signed in and remembers this choice. Always
                      on, because the site cannot work without it.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={wantAnalytics}
                      onChange={(e) => setWantAnalytics(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-accent focus:ring-accent"
                    />
                    <span className="text-sm leading-relaxed text-muted">
                      <span className="font-medium text-ink">Analytics.</span>{" "}
                      Google Analytics, so we can count visits and see which
                      pages help people. Never runs inside your circle.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5">
                    <input
                      type="checkbox"
                      checked={wantAdvertising}
                      onChange={(e) => setWantAdvertising(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-accent focus:ring-accent"
                    />
                    <span className="text-sm leading-relaxed text-muted">
                      <span className="font-medium text-ink">Advertising.</span>{" "}
                      The Meta Pixel and the X Pixel, so we can tell which
                      ads bring people to Between Us. These share data with
                      Meta and X. Never runs inside your circle, and never
                      on the sign up or log in pages.
                    </span>
                  </label>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => save(wantAnalytics, wantAdvertising)}
                    className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-text hover:bg-accent-hover"
                  >
                    Save my choices
                  </button>
                  <button
                    type="button"
                    onClick={() => save(false, false)}
                    className="rounded-full border border-border px-5 py-2.5 text-sm font-medium text-ink hover:bg-surface2"
                  >
                    Reject all
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
