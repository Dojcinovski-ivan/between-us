import type { Metadata } from "next";
import { headers } from "next/headers";
import { CrisisBanner } from "@/components/CrisisBanner";
import { getCurrentUserAndProfile } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Between Us",
  description: "An anonymous peer support community for people healing from relationship trauma.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { profile } = await getCurrentUserAndProfile();
  const pathname = headers().get("x-pathname") ?? "";
  const isLandingPage = pathname === "/";

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
          className={`flex min-h-screen flex-col bg-bg font-sans text-ink ${isLandingPage ? "force-light" : ""}`}
        >
          <div className="flex-1">{children}</div>
          <CrisisBanner country={profile?.country ?? null} />
        </div>
      </body>
    </html>
  );
}
