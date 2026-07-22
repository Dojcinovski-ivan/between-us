import type { Metadata } from "next";
import localFont from "next/font/local";
import { CrisisBanner } from "@/components/CrisisBanner";
import "./globals.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Between Us",
  description: "An anonymous peer support community for people healing from relationship trauma.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col bg-bg font-sans text-ink antialiased`}
      >
        <div className="flex-1">{children}</div>
        <CrisisBanner />
      </body>
    </html>
  );
}
