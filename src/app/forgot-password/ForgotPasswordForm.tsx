"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { requestPasswordReset } from "./actions";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Sent from the server so it goes out as a Between Us email rather
    // than Supabase's default one — see sendPasswordResetEmail.
    let ok = false;
    try {
      ({ ok } = await requestPasswordReset(email.trim()));
    } catch {
      ok = false;
    }

    setIsSubmitting(false);

    if (!ok) {
      setError("We couldn't send that just now. Please try again in a moment.");
      return;
    }

    // Shown regardless of whether the email matches an account, so this
    // page can't be used to check which emails are registered.
    setSent(true);
  }

  if (sent) {
    return (
      <Card className="text-center">
        <h2 className="text-lg font-medium text-ink">Check your email</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          If an account exists for <span className="text-ink">{email}</span>, we sent a link to
          reset your password.
        </p>
        <Link href="/login" className="mt-6 inline-block text-sm text-sage hover:text-sage-hover">
          Back to log in
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-xl font-semibold text-ink">Reset your password</h1>
      <p className="mt-1 text-sm text-muted">
        Enter the email on your account and we&apos;ll send you a link to set a new password.
      </p>

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

        {error && <p className="text-sm text-warn">{error}</p>}

        <Button type="submit" disabled={isSubmitting || !email.trim()} className="mt-2 w-full">
          {isSubmitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Remembered it?{" "}
        <Link href="/login" className="text-sage hover:text-sage-hover">
          Log in
        </Link>
      </p>
    </Card>
  );
}
