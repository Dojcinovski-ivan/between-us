import type { Metadata } from "next";
import { headers } from "next/headers";
import { CrisisBanner } from "@/components/CrisisBanner";
import { CookieConsent } from "@/components/CookieConsent";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://betweenussupport.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Between Us",
  description: "An anonymous peer support community for people healing from relationship trauma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = headers().get("x-pathname") ?? "";
  // The landing page, the blog, and the legal pages are the app's warm,
  // editorial, always-light sections — everywhere else respects the
  // user's theme.
  const isAlwaysLightPage =
    pathname === "/" ||
    pathname === "/blog" ||
    pathname.startsWith("/blog/") ||
    pathname === "/privacy" ||
    pathname === "/terms";

  return (
    <html lang="en">
      <head>
        {/* Applies the saved theme before first paint so there is no
            flash of the wrong theme. Light is the default; dark only
            applies when the user has explicitly opted in before. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark');}}catch(e){}`,
          }}
        />
      </head>
      <body className="antialiased">
        <div
          className={`flex min-h-screen flex-col bg-bg font-sans text-ink ${isAlwaysLightPage ? "force-light" : ""}`}
        >
          <div className="flex-1">{children}</div>
          <CrisisBanner />
          <CookieConsent />
        </div>
      </body>
    </html>
  );
}
