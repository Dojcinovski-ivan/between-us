"use client";

import type { CategoryOption } from "@/lib/categories";

// One dropdown shape for every admin content form. The options come from the
// live circles table, so a category that has real circles or waiting members
// is labelled as such and sorts to the top — an admin picking a category can
// see at a glance which ones have people in them.
export function CategorySelect({
  value,
  onChange,
  options,
  includeAll,
  allLabel = "All circles",
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  options: CategoryOption[];
  includeAll?: boolean;
  allLabel?: string;
  id?: string;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl border border-border bg-surface2 px-4 py-3 text-sm text-ink focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage"
    >
      {includeAll && <option value="">{allLabel}</option>}
      {options.map((c) => (
        <option key={c.slug} value={c.slug}>
          {c.label}
          {optionSuffix(c)}
        </option>
      ))}
    </select>
  );
}

function optionSuffix(c: CategoryOption): string {
  if (c.circles > 0) {
    return ` — ${c.circles} circle${c.circles === 1 ? "" : "s"}, ${c.members} member${c.members === 1 ? "" : "s"}`;
  }
  if (c.members > 0) return ` — ${c.members} waiting`;
  return " — no circle yet";
}
