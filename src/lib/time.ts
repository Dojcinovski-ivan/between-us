export function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(days / 365);
  return `${years}y ago`;
}

// Monday-based week start, in the viewer's local timezone.
export function weekStart(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function isSameWeek(a: Date, b: Date): boolean {
  return weekStart(a).getTime() === weekStart(b).getTime();
}

export function formatWeekLabel(date: Date): string {
  // Locale fixed to "en-US" rather than left to the runtime default:
  // that default resolves differently on the server than in the
  // browser, which previously produced a server/client mismatch
  // ("Jun 29" vs "29 Jun") and triggered a full hydration reset.
  return `Week of ${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

// The next occurrence of Monday, counting today. Used to default the
// prompt week-start picker to the upcoming prompt week.
export function nextMonday(from: Date = new Date()): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const daysUntilMonday = day === 1 ? 0 : (8 - day) % 7;
  d.setDate(d.getDate() + daysUntilMonday);
  return d;
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// 1-indexed: the first 7 days since joining are "week 1".
export function weeksSince(dateString: string, from: Date = new Date()): number {
  const start = new Date(dateString);
  const days = Math.floor((from.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.floor(days / 7) + 1);
}

const FOUR_WEEKS_MS = 4 * 7 * 24 * 60 * 60 * 1000;

export function isEligibleForCheckIn(joinedAt: string, lastCheckInAt: string | null, now: Date = new Date()): boolean {
  const joined = new Date(joinedAt).getTime();
  if (now.getTime() - joined < FOUR_WEEKS_MS) return false;
  if (!lastCheckInAt) return true;
  return now.getTime() - new Date(lastCheckInAt).getTime() >= FOUR_WEEKS_MS;
}
