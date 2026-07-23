"use client";

import { useState } from "react";

export function WeekSection({
  label,
  count,
  defaultOpen = false,
  children,
}: {
  label: string;
  count: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-left text-sm font-medium text-muted hover:text-ink"
      >
        <span>
          {label} <span className="text-faint">· {count}</span>
        </span>
        <span className="text-faint">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="mt-2 flex flex-col gap-3">{children}</div>}
    </div>
  );
}
