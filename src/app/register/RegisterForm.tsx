"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { GoogleButton } from "@/components/GoogleButton";
import { registerAccount } from "./actions";
import { isOldEnough, MINIMUM_AGE } from "@/lib/age";

export function RegisterForm({ invited = false }: { invited?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [dobDay, setDobDay] = useState("");
  const [dobMonth, setDobMonth] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Checked before the password rules so someone too young is turned
    // away before they invest anything in the form. The date itself never
    // leaves the browser: only the pass or fail is sent on.
    const day = Number(dobDay);
    const month = Number(dobMonth);
    const year = Number(dobYear);

    if (!dobDay || !dobMonth || !dobYear) {
      setError("Please enter your date of birth.");
      return;
    }
    if (!isOldEnough(day, month, year)) {
      setError(
        `Between Us is for adults, so you need to be ${MINIMUM_AGE} or over to join. If you are going through something and need support right now, findahelpline.com lists free confidential helplines in your country, including ones for young people.`,
      );
      return;
    }

    if (password.length < 8) {
      setError("Your password needs to be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Those passwords don't match.");
      return;
    }

    setIsSubmitting(true);

    // Created server side so the confirmation email comes from Between Us
    // rather than Supabase — see sendSignupConfirmationEmail.
    let status: "sent" | "exists" | "failed" | "underage" = "failed";
    try {
      ({ status } = await registerAccount({
        email,
        password,
        marketingConsent,
        ageConfirmation: { day, month, year },
      }));
    } catch {
      status = "failed";
    }

    setIsSubmitting(false);

    if (status === "underage") {
      setError(
        `Between Us is for adults, so you need to be ${MINIMUM_AGE} or over to join. If you are going through something and need support right now, findahelpline.com lists free confidential helplines in your country, including ones for young people.`,
      );
      return;
    }
    if (status === "exists") {
      setError("There's already an account with that email. Try logging in instead.");
      return;
    }
    if (status === "failed") {
      setError("We couldn't create your account just now. Please try again in a moment.");
      return;
    }

    setCheckEmail(true);
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

      {/* Said before anyone signs up, not buried in the Terms. Between Us
          is peer support, and someone arriving in real distress needs to
          know that before they rely on it. */}
      <div className="mt-5 rounded-2xl border border-border bg-surface2 p-4">
        <p className="text-sm leading-relaxed text-ink">
          Between Us is a peer support community, not therapy.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          You will be talking with people who have lived through similar
          things, not with therapists or counsellors. Nobody here can
          diagnose or treat anything, and this is not a substitute for
          professional care. If you are in crisis or in danger right now,
          please contact your local emergency services or find a free
          confidential helpline at{" "}
          <a
            href="https://findahelpline.com"
            target="_blank"
            rel="noreferrer"
            className="text-ink underline underline-offset-4"
          >
            findahelpline.com
          </a>
          .
        </p>
      </div>

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

        <fieldset>
          <legend className="text-sm font-medium text-ink">Date of birth</legend>
          <p className="mt-1 text-xs text-faint">
            Between Us is for adults. We check your age and then discard the
            date, so your birthday is never stored.
          </p>
          <div className="mt-2 flex gap-2">
            <input
              aria-label="Day"
              placeholder="DD"
              inputMode="numeric"
              autoComplete="bday-day"
              maxLength={2}
              required
              value={dobDay}
              onChange={(e) => setDobDay(e.target.value.replace(/\D/g, ""))}
              className="w-16 rounded-xl border border-border bg-surface2 px-3 py-3 text-center text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              aria-label="Month"
              placeholder="MM"
              inputMode="numeric"
              autoComplete="bday-month"
              maxLength={2}
              required
              value={dobMonth}
              onChange={(e) => setDobMonth(e.target.value.replace(/\D/g, ""))}
              className="w-16 rounded-xl border border-border bg-surface2 px-3 py-3 text-center text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              aria-label="Year"
              placeholder="YYYY"
              inputMode="numeric"
              autoComplete="bday-year"
              maxLength={4}
              required
              value={dobYear}
              onChange={(e) => setDobYear(e.target.value.replace(/\D/g, ""))}
              className="w-24 rounded-xl border border-border bg-surface2 px-3 py-3 text-center text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
        </fieldset>

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

      <p className="mt-5 text-center text-xs leading-relaxed text-faint">
        By creating an account you agree to our{" "}
        <Link href="/terms" className="text-sage hover:text-sage-hover">
          Terms of Service
        </Link>
        . Our{" "}
        <Link href="/privacy" className="text-sage hover:text-sage-hover">
          Privacy Policy
        </Link>{" "}
        explains what we collect and why.
      </p>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="text-sage hover:text-sage-hover">
          Log in
        </Link>
      </p>
    </Card>
  );
}
