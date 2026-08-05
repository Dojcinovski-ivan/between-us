"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { FELT_EXPERIENCES, type FeltExperienceSlug } from "@/lib/feltExperience";
import { WHO_WAS_IT, type WhoWasItSlug } from "@/lib/whoWasIt";
import { MECHANISMS, type MechanismSlug } from "@/lib/mechanisms";
import { JOURNEY_STAGES } from "@/lib/journeyStages";
import { AGE_RANGES } from "@/lib/ageRanges";
import { GENDERS } from "@/lib/genders";
import { COUNTRIES } from "@/lib/countries";
import { suggestAnonymousName } from "@/lib/anonymousNames";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { QuestionScreen } from "./QuestionScreen";
import { OptionCard } from "./OptionCard";
import { completeOnboarding, completeInviteOnboarding } from "./actions";

export function OnboardingWizard({ invited = false }: { invited?: boolean }) {
  const [step, setStep] = useState(0);
  const [feltExperience, setFeltExperience] = useState<FeltExperienceSlug | null>(null);
  const [whoWasIt, setWhoWasIt] = useState<WhoWasItSlug | null>(null);
  const [mechanisms, setMechanisms] = useState<MechanismSlug[]>([]);
  const [journeyStage, setJourneyStage] = useState<string | null>(null);
  const [ageRange, setAgeRange] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [country, setCountry] = useState("");
  const [username, setUsername] = useState(() => suggestAnonymousName());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInviteSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await completeInviteOnboarding(username);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  // Invite members skip screens 1 through 7 entirely, going straight to
  // just the name screen below. Nothing past this block is touched, so
  // the normal 8 screen flow stays exactly as it was for everyone else.
  if (invited) {
    return (
      <QuestionScreen
        step={1}
        totalSteps={1}
        heading="Choose your name here."
        subtext="This is the only name anyone will ever see. No real names. Ever."
        warmNote="This is your safe space."
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

        <Button onClick={handleInviteSubmit} disabled={isPending || !username.trim()} className="w-full">
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

  function goBack() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function selectAndAdvance<T>(setter: (v: T) => void, value: T) {
    setter(value);
    setStep((s) => s + 1);
  }

  function toggleMechanism(slug: MechanismSlug) {
    setMechanisms((prev) =>
      prev.includes(slug) ? prev.filter((m) => m !== slug) : [...prev, slug],
    );
  }

  function handleSubmit() {
    if (!feltExperience || !whoWasIt || mechanisms.length === 0 || !journeyStage || !ageRange || !gender || !country) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await completeOnboarding({
        feltExperience,
        whoWasIt,
        mechanisms,
        journeyStage,
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
        <h1 className="text-2xl font-semibold text-ink">You are in the right place.</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          We want to make sure you find the right circle. We will ask you a
          few gentle questions. There are no wrong answers. Take your time.
        </p>
        <Button onClick={() => setStep(1)} className="mt-6 w-full">
          I am ready
        </Button>
      </Card>
    );
  }

  // Screen 1 — felt experience
  if (step === 1) {
    return (
      <QuestionScreen
        step={1}
        heading="Which of these feels closest to where you are right now?"
        subtext="Choose the one that resonates most. You can always explore more later."
        warmNote="Whatever you choose, you will find understanding here."
        onBack={goBack}
      >
        {FELT_EXPERIENCES.map((f) => (
          <OptionCard
            key={f.slug}
            label={f.label}
            selected={feltExperience === f.slug}
            onClick={() => selectAndAdvance(setFeltExperience, f.slug)}
          />
        ))}
      </QuestionScreen>
    );
  }

  // Screen 2 — who was it
  if (step === 2) {
    return (
      <QuestionScreen
        step={2}
        heading="Who is this mostly about?"
        subtext="This helps us find people who truly understand your experience."
        warmNote="There is no right answer. Just what feels truest."
        onBack={goBack}
      >
        {WHO_WAS_IT.map((w) => (
          <OptionCard
            key={w.slug}
            label={w.label}
            selected={whoWasIt === w.slug}
            onClick={() => selectAndAdvance(setWhoWasIt, w.slug)}
          />
        ))}
      </QuestionScreen>
    );
  }

  // Screen 3 — mechanisms (multi select)
  if (step === 3) {
    return (
      <QuestionScreen
        step={3}
        heading="What was it like? Choose everything that fits."
        subtext="You can select more than one."
        warmNote="Your experience is valid whatever it looked like."
        onBack={goBack}
      >
        {MECHANISMS.map((m) => (
          <OptionCard
            key={m.slug}
            label={m.label}
            selected={mechanisms.includes(m.slug)}
            onClick={() => toggleMechanism(m.slug)}
          />
        ))}
        <Button onClick={() => setStep(4)} disabled={mechanisms.length === 0} className="mt-1 w-full">
          Continue
        </Button>
      </QuestionScreen>
    );
  }

  // Screen 4 — how long
  if (step === 4) {
    return (
      <QuestionScreen
        step={4}
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

  // Screen 5 — age range
  if (step === 5) {
    return (
      <QuestionScreen
        step={5}
        heading="How old are you?"
        subtext="We use this to connect you with people at a similar stage of life. It is never shown to other members."
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

  // Screen 6 — gender
  if (step === 6) {
    return (
      <QuestionScreen
        step={6}
        heading="How do you identify?"
        subtext="This is optional. Some people feel more comfortable in circles with others who share their identity."
        warmNote="Whatever you choose, you will find understanding here."
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

  // Screen 7 — country
  if (step === 7) {
    return (
      <QuestionScreen
        step={7}
        heading="Which country are you in?"
        subtext="We use this to show you the right crisis resources if you ever need them. It is never shown to other members."
        warmNote="Your location is only used for crisis resources."
        onBack={goBack}
      >
        <div className="rounded-2xl border border-sage/40 bg-sage-soft p-4">
          <p className="text-sm leading-relaxed text-ink">
            Between Us is currently available in English only. Your country
            selection helps us show you relevant crisis resources. It does
            not affect which circle you join. All circles are conducted in
            English.
          </p>
        </div>
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
        <Button onClick={() => setStep(8)} disabled={!country} className="w-full">
          Continue
        </Button>
      </QuestionScreen>
    );
  }

  // Screen 8 — anonymous name
  return (
    <QuestionScreen
      step={8}
      heading="Choose your name here."
      subtext="This is the only name anyone will ever see. No real names. Ever."
      warmNote="This is your safe space."
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
