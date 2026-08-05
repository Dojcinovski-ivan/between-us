"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { GoogleButton } from "@/components/GoogleButton";

export function RegisterForm({ invited = false }: { invited?: boolean }) {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Your password needs to be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match.");
      return;
    }

    setIsSubmitting(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { email_marketing_consent: marketingConsent },
      },
    });
    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (data.session) {
      router.push("/onboarding");
      router.refresh();
    } else {
      setCheckEmail(true);
    }
  }

  if (checkEmail) {
    return (
      <Card className="text-center">
        <h2 className="text-lg font-medium text-ink">Check your email</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          We sent a confirmation link to <span className="text-ink">{email}</span>.
          Click it to finish creating your account.
        </p>
      </Card>
    );
  }

  return (
    <Card>
      {invited && (
        <div className="mb-6 rounded-2xl border border-sage/40 bg-sage-soft p-4">
          <p className="text-sm leading-relaxed text-ink">
            You have been invited to join a circle on Between Us. Create your account to get started.
          </p>
        </div>
      )}
      <h1 className="text-xl font-semibold text-ink">Create your account</h1>
      <p className="mt-1 text-sm text-muted">
        Your email stays private, you&apos;ll pick an anonymous username next.
      </p>

      <div className="mt-6">
        <GoogleButton />
      </div>

      <div className="mt-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-faint">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirm password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <label className="flex items-start gap-2.5">
          <input
            type="checkbox"
            checked={marketingConsent}
            onChange={(e) => setMarketingConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-sage focus:ring-sage"
          />
          <span className="text-sm leading-relaxed text-muted">
            I would like to receive circle updates and news from Between Us
            by email (optional)
          </span>
        </label>
        <p className="-mt-2 text-xs text-faint">
          You can unsubscribe at any time from your profile settings.
        </p>

        {error && <p className="text-sm text-warn">{error}</p>}

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-sage hover:text-sage-hover">
          Log in
        </Link>
      </p>
    </Card>
  );
}
