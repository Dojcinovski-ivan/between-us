import type { Metadata } from "next";
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

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-bg font-sans text-ink antialiased">
        <div className="flex-1">{children}</div>
        <CrisisBanner country={profile?.country ?? null} />
      </body>
    </html>
  );
}
