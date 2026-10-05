"use client";

const fieldClass =
  "rounded-xl border border-border bg-surface2 px-3 py-3 text-center text-sm text-ink placeholder:text-faint focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

type Props = {
  day: string;
  month: string;
  year: string;
  onDay: (value: string) => void;
  onMonth: (value: string) => void;
  onYear: (value: string) => void;
};

// Shared by the register form and the date of birth step in onboarding.
export function DateOfBirthFields({ day, month, year, onDay, onMonth, onYear }: Props) {
  const digits = (value: string) => value.replace(/\D/g, "");

  return (
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
          value={day}
          onChange={(e) => onDay(digits(e.target.value))}
          className={`w-16 ${fieldClass}`}
        />
        <input
          aria-label="Month"
          placeholder="MM"
          inputMode="numeric"
          autoComplete="bday-month"
          maxLength={2}
          required
          value={month}
          onChange={(e) => onMonth(digits(e.target.value))}
          className={`w-16 ${fieldClass}`}
        />
        <input
          aria-label="Year"
          placeholder="YYYY"
          inputMode="numeric"
          autoComplete="bday-year"
          maxLength={4}
          required
          value={year}
          onChange={(e) => onYear(digits(e.target.value))}
          className={`w-24 ${fieldClass}`}
        />
      </div>
    </fieldset>
  );
}
