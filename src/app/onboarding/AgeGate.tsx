"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DateOfBirthFields } from "@/components/DateOfBirthFields";
import { ageFromParts, UNDERAGE_MESSAGE } from "@/lib/age";
import { confirmAge } from "./ageActions";

const INVALID_DATE = "That doesn't look like a real date. Please check it.";

// Shown in place of the wizard to an account that has not passed the age
// check yet. The check that counts is the one in confirmAge.
export function AgeGate() {
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnedAway, setTurnedAway] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!day || !month || !year) {
      setError("Please enter your date of birth.");
      return;
    }
    const dob = { day: Number(day), month: Number(month), year: Number(year) };
    // A date that isn't real is a typo to fix, not an answer to send.
    if (ageFromParts(dob.day, dob.month, dob.year) === null) {
      setError(INVALID_DATE);
      return;
    }

    setIsSubmitting(true);
    let status = "failed";
    try {
      // Redirects on success, so anything returned is a problem.
      ({ status } = await confirmAge(dob));
    } catch {
      status = "failed";
    }
    setIsSubmitting(false);

    if (status === "underage") setTurnedAway(true);
    else if (status === "invalid") setError(INVALID_DATE);
    else if (status === "expired") setError("Your session expired. Please log in again.");
    else setError("Something went wrong. Please try again in a moment.");
  }

  if (turnedAway) {
    return (
      <Card>
        <h1 className="text-xl font-semibold text-ink">Between Us is for adults</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{UNDERAGE_MESSAGE}</p>
        <a
          href="https://findahelpline.com"
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm text-ink underline underline-offset-4"
        >
          Open findahelpline.com
        </a>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-xl font-semibold text-ink">One thing first</h1>
      <p className="mt-1 text-sm text-muted">Before you find your circle, we need to check your age.</p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
        <DateOfBirthFields day={day} month={month} year={year} onDay={setDay} onMonth={setMonth} onYear={setYear} />

        {error && <p className="text-sm text-warn">{error}</p>}

        <Button type="submit" disabled={isSubmitting} className="mt-2 w-full">
          {isSubmitting ? "Checking…" : "Continue"}
        </Button>
      </form>
    </Card>
  );
}
