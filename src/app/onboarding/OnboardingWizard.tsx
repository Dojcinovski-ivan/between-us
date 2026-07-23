"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { CATEGORIES, type CategorySlug } from "@/lib/categories";
import { JOURNEY_STAGES } from "@/lib/journeyStages";
import { FEELINGS } from "@/lib/feelings";
import { AGE_RANGES } from "@/lib/ageRanges";
import { GENDERS } from "@/lib/genders";
import { COUNTRIES } from "@/lib/countries";
import { suggestAnonymousName } from "@/lib/anonymousNames";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QuestionScreen } from "./QuestionScreen";
import { OptionCard } from "./OptionCard";
import { completeOnboarding } from "./actions";

export function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [category, setCategory] = useState<CategorySlug | null>(null);
  const [categoryOtherText, setCategoryOtherText] = useState("");
  const [journeyStage, setJourneyStage] = useState<string | null>(null);
  const [feeling, setFeeling] = useState<string | null>(null);
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [country, setCountry] = useState("");
  const [username, setUsername] = useState(() => suggestAnonymousName());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function goBack() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function selectAndAdvance<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setStep((s) => s + 1);
  }

  function handleSubmit() {
    if (!category || !journeyStage || !feeling || !ageRange || !gender || !country) return;
    setError(null);
    startTransition(async () => {
      const result = await completeOnboarding({
        category,
        categoryOtherText: category === "something_else" ? categoryOtherText : "",
        journeyStage,
        feeling,
        ageRange,
        gender,
        country,
        username,
      });
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  // Opening screen
  if (step === 0) {
    return (
      <Card className="text-center">
        <h1 className="text-2xl font-semibold text-ink">You&apos;re in the right place.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We want to make sure you find the right circle — people who truly
          understand what you&apos;ve been through. We&apos;ll ask you a few
          gentle questions. Take your time.
        </p>
        <Button onClick={() => setStep(1)} className="mt-6 w-full">
          Let&apos;s begin →
        </Button>
      </Card>
    );
  }

  // Screen 1 — category
  if (step === 1) {
    return (
      <QuestionScreen
        step={1}
        heading="What brought you here?"
        subtext="Choose the one that feels closest to your experience."
        warmNote="There are no wrong answers. This helps us find people who understand."
        onBack={goBack}
      >
        {CATEGORIES.map((c) => (
          <OptionCard
            key={c.slug}
            label={c.label}
            selected={category === c.slug}
            onClick={() => {
              if (c.slug === "something_else") {
                setCategory(c.slug);
              } else {
                selectAndAdvance(setCategory, c.slug);
              }
            }}
          />
        ))}

        {category === "something_else" && (
          <div className="mt-1 flex flex-col gap-3">
            <textarea
              value={categoryOtherText}
              onChange={(e) => setCategoryOtherText(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Tell us a little about what brought you here."
              className="resize-none rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <Button
              onClick={() => setStep(2)}
              disabled={!categoryOtherText.trim()}
              className="w-full"
            >
              Continue
            </Button>
          </div>
        )}
      </QuestionScreen>
    );
  }

  // Screen 2 — journey stage
  if (step === 2) {
    return (
      <QuestionScreen
        step={2}
        heading="How long have you been carrying this?"
        subtext="This helps us connect you with people at a similar point in their journey."
        warmNote="Wherever you are is exactly where you need to be."
        onBack={goBack}
      >
        {JOURNEY_STAGES.map((s) => (
          <OptionCard
            key={s.slug}
            label={s.label}
            selected={journeyStage === s.slug}
            onClick={() => selectAndAdvance(setJourneyStage, s.slug)}
          />
        ))}
      </QuestionScreen>
    );
  }

  // Screen 3 — current feeling
  if (step === 3) {
    return (
      <QuestionScreen
        step={3}
        heading="How are you feeling right now?"
        subtext="Be honest — this is just between us."
        warmNote="There's no right answer. We just want to understand where you are today."
        onBack={goBack}
      >
        {FEELINGS.map((f) => (
          <OptionCard
            key={f.slug}
            label={f.label}
            selected={feeling === f.slug}
            onClick={() => selectAndAdvance(setFeeling, f.slug)}
          />
        ))}
      </QuestionScreen>
    );
  }

  // Screen 4 — age range
  if (step === 4) {
    return (
      <QuestionScreen
        step={4}
        heading="How old are you?"
        subtext="We use this to connect you with people at a similar stage of life."
        warmNote="Your age is never shown to other members."
        onBack={goBack}
      >
        {AGE_RANGES.map((a) => (
          <OptionCard
            key={a.slug}
            label={a.label}
            selected={ageRange === a.slug}
            onClick={() => selectAndAdvance(setAgeRange, a.slug)}
          />
        ))}
      </QuestionScreen>
    );
  }

  // Screen 5 — gender
  if (step === 5) {
    return (
      <QuestionScreen
        step={5}
        heading="How do you identify?"
        subtext="This is optional. Some people feel more comfortable in circles with others who share their identity."
        warmNote="Whatever you choose, you'll find understanding here."
        onBack={goBack}
      >
        {GENDERS.map((g) => (
          <OptionCard
            key={g.slug}
            label={g.label}
            selected={gender === g.slug}
            onClick={() => selectAndAdvance(setGender, g.slug)}
          />
        ))}
      </QuestionScreen>
    );
  }

  // Screen 6 — country
  if (step === 6) {
    return (
      <QuestionScreen
        step={6}
        heading="Which country are you in?"
        subtext="We use this to show you the right crisis resources if you ever need them."
        warmNote="Your location is never shown to other members."
        onBack={goBack}
      >
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        >
          <option value="" disabled>
            Select your country
          </option>
          {COUNTRIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button onClick={() => setStep(7)} disabled={!country} className="w-full">
          Continue
        </Button>
      </QuestionScreen>
    );
  }

  // Screen 7 — anonymous name
  return (
    <QuestionScreen
      step={7}
      heading="One last thing — choose your name here."
      subtext="This is the only name anyone will ever see. Make it something you feel comfortable with."
      warmNote="No real names. Ever. This is your safe space."
      onBack={goBack}
    >
      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
      />
      <button
        type="button"
        onClick={() => setUsername(suggestAnonymousName())}
        className="w-fit text-xs text-accent hover:text-accent-hover"
      >
        🔄 Suggest another name
      </button>

      {error && <p className="text-sm text-warn">{error}</p>}

      <Button onClick={handleSubmit} disabled={isPending || !username.trim()} className="w-full">
        {isPending ? "Joining…" : "Join your circle"}
      </Button>

      <p className="text-center text-xs text-faint">
        By joining, you agree to our{" "}
        <Link href="/guidelines" className="text-accent hover:text-accent-hover">
          community guidelines
        </Link>
        .
      </p>
    </QuestionScreen>
  );
}
