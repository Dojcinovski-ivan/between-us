"use client";

import Script from "next/script";

// Public identifier, same reasoning as the Meta pixel: it ships in the
// client bundle either way, so it is a constant with an env override
// rather than a secret.
const PIXEL_ID = process.env.NEXT_PUBLIC_X_PIXEL_ID ?? "rf8km";

/**
 * X (Twitter) conversion tracking, mounted only by CookieConsent once
 * analytics consent has been given, and never on the logged in pages.
 * X's own instructions say to paste this into every page's head, which
 * would fire it before anyone has agreed to anything and contradict both
 * the cookie banner and the privacy policy.
 *
 * Unlike the Meta snippet this one keeps its own page view: twq('config')
 * both initialises the pixel and counts the load, and there is no
 * documented way to suppress just the counting half. That means X counts
 * the page someone lands on, and does not see client side navigation
 * after it. Meta is wired the other way around, with the snippet's own
 * PageView stripped and every route counted through trackPageView.
 */
export function XPixel() {
  return (
    <Script
      id="x-pixel"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
!function(e,t,n,s,u,a){e.twq||(s=e.twq=function(){s.exe?s.exe.apply(s,arguments):s.queue.push(arguments);
},s.version='1.1',s.queue=[],u=t.createElement(n),u.async=!0,u.src='https://static.ads-twitter.com/uwt.js',
a=t.getElementsByTagName(n)[0],a.parentNode.insertBefore(u,a))}(window,document,'script');
twq('config','${PIXEL_ID}');
        `,
      }}
    />
  );
}
