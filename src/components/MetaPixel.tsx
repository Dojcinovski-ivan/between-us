"use client";

import { useEffect } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { PROTECTED_PATHS } from "@/lib/protectedPaths";

// Public identifier — it ships in the client bundle either way, so it is
// a constant with an env override rather than a secret, same shape as
// SITE_URL elsewhere.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1378776633780688";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    __betweenUsPixelPath?: string;
  }
}

// The last path counted, parked on window rather than in a ref because
// this component remounts on navigation — a ref resets with it, which
// silently dropped the PageView for every route after the first.
function trackPageView(pathname: string | null) {
  if (!pathname) return;

  // Never from inside the logged in app. These are private support
  // circles, and which one someone is reading is not something to hand
  // to an ad network.
  if (PROTECTED_PATHS.some((path) => pathname.startsWith(path))) return;

  // Script hasn't executed yet — onReady fires this instead. Bailing out
  // before the path is recorded is what makes that safe.
  if (typeof window.fbq !== "function") return;

  if (window.__betweenUsPixelPath === pathname) return;
  window.__betweenUsPixelPath = pathname;

  window.fbq("track", "PageView");
}

/**
 * Meta Pixel, mounted only by CookieConsent once analytics consent has
 * actually been given — never from the layout directly. Meta's own
 * instructions say to paste this into every page's <head>, which would
 * fire it before anyone has agreed to anything and contradict both the
 * cookie banner and the privacy policy.
 *
 * The snippet is Meta's, minus its trailing PageView: a single hardcoded
 * fire only counts the entry page, and client side navigation never
 * re-runs it. Every view goes through trackPageView instead, so routes
 * are counted once each and the exclusions apply to all of them.
 *
 * No <noscript> fallback: consent lives in a cookie this client component
 * reads after mount, so with scripts disabled nothing here renders at all
 * and the tracking pixel image would have nothing to gate it.
 */
export function MetaPixel() {
  const pathname = usePathname();

  useEffect(() => {
    trackPageView(pathname);
  }, [pathname]);

  return (
    <Script
      id="meta-pixel"
      strategy="afterInteractive"
      onReady={() => trackPageView(pathname)}
      dangerouslySetInnerHTML={{
        __html: `
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
        `,
      }}
    />
  );
}
