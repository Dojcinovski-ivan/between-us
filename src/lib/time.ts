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
  return `Week of ${date.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
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
