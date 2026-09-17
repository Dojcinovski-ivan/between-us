// Between Us is an adults only service: the Terms say eighteen or over,
// and until now nothing checked. This is the check.
//
// The date of birth is never stored. It is entered, used to work out
// whether the person is old enough, and discarded. The only thing that
// reaches the database is the fact that the check passed and when, which
// is all the service actually needs to know and the least it can hold.

export const MINIMUM_AGE = 18;

/**
 * Whole years between a date of birth and today, or null if the parts do
 * not describe a real date. Rejects impossible dates like 31 February
 * rather than letting Date roll them over into March.
 */
export function ageFromParts(day: number, month: number, year: number): number | null {
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;

  const dob = new Date(Date.UTC(year, month - 1, day));
  if (
    dob.getUTCFullYear() !== year ||
    dob.getUTCMonth() !== month - 1 ||
    dob.getUTCDate() !== day
  ) {
    return null;
  }

  const now = new Date();
  if (dob.getTime() > now.getTime()) return null;
  // Nobody is 130. A year like 1002 is a typo, not a birthday.
  if (year < now.getUTCFullYear() - 130) return null;

  let age = now.getUTCFullYear() - year;
  const hasHadBirthdayThisYear =
    now.getUTCMonth() > month - 1 ||
    (now.getUTCMonth() === month - 1 && now.getUTCDate() >= day);
  if (!hasHadBirthdayThisYear) age -= 1;

  return age;
}

export function isOldEnough(day: number, month: number, year: number): boolean {
  const age = ageFromParts(day, month, year);
  return age !== null && age >= MINIMUM_AGE;
}
