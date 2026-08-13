import Link from "next/link";
import { LogoMark } from "@/app/_landing/LogoMark";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata = {
  title: "Reset Password — Between Us",
  robots: { index: false, follow: false },
};

// Deliberately does not check auth state server side (unlike /login and
// /forgot-password): the whole point of this page is to be landed on
// with a recovery session that only the client can see, encoded in the
// URL. ResetPasswordForm handles all of the actual gating.
export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center gap-8 px-6 py-16">
      <Link href="/" className="flex items-center gap-2.5">
        <LogoMark className="h-8 w-8 text-accent" />
        <span className="font-display text-xl text-ink">Between Us</span>
      </Link>
      <div className="w-full max-w-sm">
        <ResetPasswordForm />
      </div>
    </main>
  );
}
