import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { LogoMark } from "@/app/_landing/LogoMark";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata = {
  title: "Forgot Password — Between Us",
  description: "Reset your Between Us password.",
};

export default async function ForgotPasswordPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (user && profile?.circle_id) redirect("/circle");
  if (user && !profile?.circle_id) redirect("/onboarding");

  return (
    <main className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-8 px-6 py-16">
      <Link href="/" className="flex items-center gap-2.5">
        <LogoMark className="h-8 w-8 text-accent" />
        <span className="font-display text-xl text-ink">Between Us</span>
      </Link>
      <div className="w-full max-w-sm">
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
