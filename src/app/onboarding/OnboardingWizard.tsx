"use client";

import { useState, useTransition } from "react";
import { CATEGORIES, categoryLabel } from "@/lib/categories";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { completeOnboarding } from "./actions";

type Step = "category" | "profile";

export function OnboardingWizard() {
  const [step, setStep] = useState<Step>("category");
  const [category, setCategory] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!category) return;
    setError(null);
    startTransition(async () => {
      const result = await completeOnboarding({ username, category, bio });
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  if (step === "category") {
    return (
      <Card>
        <p className="text-xs font-medium uppercase tracking-wide text-faint">Step 1 of 2</p>
        <h1 className="mt-2 text-xl font-semibold text-ink">What brings you here?</h1>
        <p className="mt-1 text-sm text-muted">
          This connects you with a circle of people navigating something similar. You can&apos;t change this later.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                category === c.slug
                  ? "border-sage bg-sage-soft"
                  : "border-border bg-surface2 hover:bg-surface2/70"
              }`}
            >
              <p className="font-medium text-ink">{c.label}</p>
              <p className="mt-0.5 text-sm text-muted">{c.description}</p>
            </button>
          ))}
        </div>

        <Button
          type="button"
          disabled={!category}
          onClick={() => setStep("profile")}
          className="mt-6 w-full"
        >
          Continue
        </Button>
      </Card>
    );
  }

  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-faint">Step 2 of 2</p>
      <h1 className="mt-2 text-xl font-semibold text-ink">Choose how you&apos;ll show up</h1>
      <p className="mt-1 text-sm text-muted">
        You&apos;re joining the <span className="text-ink">{categoryLabel(category!)}</span> circle. We
        recommend not using your real name — this space stays anonymous.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <Input
          label="Username"
          name="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="e.g. quiet_river"
          hint="3-20 characters: letters, numbers, underscores."
        />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="bio" className="text-sm font-medium text-muted">
            A short note about yourself{" "}
            <span className="text-faint">(optional)</span>
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={3}
            maxLength={200}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Share as much or as little as you'd like."
            className="resize-none rounded-xl border border-border bg-surface2 px-4 py-3 text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
          />
        </div>

        {error && <p className="text-sm text-warn">{error}</p>}

        <div className="mt-2 flex flex-col-reverse gap-3 sm:flex-row">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStep("category")}
            className="sm:flex-1"
          >
            Back
          </Button>
          <Button type="submit" disabled={isPending} className="sm:flex-1">
            {isPending ? "Joining…" : "Join your circle"}
          </Button>
        </div>
      </form>
    </Card>
  );
}
