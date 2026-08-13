"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

const READY_TIMEOUT_MS = 5000;

type Status = "checking" | "ready" | "invalid" | "done";

export function ResetPasswordForm() {
  const supabase = createClient();
  const router = useRouter();

  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The reset link lands here with the recovery session encoded in the
  // URL rather than a query param this page could read server side —
  // supabase-js parses it client side and fires PASSWORD_RECOVERY once
  // it's processed. getSession() is a fallback for the rare case where
  // that already happened before this listener was attached. If neither
  // fires within a few seconds, the link is treated as invalid/expired.
  useEffect(() => {
    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setStatus("ready");
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setStatus((current) => (current === "checking" ? "ready" : current));
    });

    const timeout = setTimeout(() => {
      setStatus((current) => (current === "checking" ? "invalid" : current));
    }, READY_TIMEOUT_MS);

    return () => {
      subscription.subscription.unsubscribe();
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSubmitting(false);

    if (updateError) {
      setError("Something went wrong. Please request a new reset link and try again.");
      return;
    }

    setStatus("done");
  }

  if (status === "checking") {
    return (
      <Card className="text-center">
        <p className="text-sm text-muted">Verifying your link…</p>
      </Card>
    );
  }

  if (status === "invalid") {
    return (
      <Card className="text-center">
        <h2 className="text-lg font-medium text-ink">This link isn&apos;t valid.</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          It may have expired or already been used.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-block text-sm text-sage hover:text-sage-hover"
        >
          Request a new link
        </Link>
      </Card>
    );
  }

  if (status === "done") {
    return (
      <Card className="text-center">
        <h2 className="text-lg font-medium text-ink">Password updated.</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          You can now continue with your new password.
        </p>
        <Button className="mt-6 w-full" onClick={() => router.push("/circle")}>
          Continue
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-xl font-semibold text-ink">Set a new password</h1>
      <p className="mt-1 text-sm text-muted">Choose a new password for your account.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          label="New password"
          type="password"
          name="password"
          autoComplete="new-password"
          required
          hint="At least 8 characters."
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirm new password"
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && <p className="text-sm text-warn">{error}</p>}

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? "Saving…" : "Save new password"}
        </Button>
      </form>
    </Card>
  );
}
