"use client";

import { useEffect, type ReactNode } from "react";

// A plain centred dialog for the Circles tab. Deliberately local to the
// admin screens rather than added to components/ui, so nothing on the
// member facing side of the app picks up a new shared component.
export function AdminModal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border border-border bg-surface p-6 shadow-lift sm:rounded-2xl"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-lg px-2 py-1 text-muted hover:text-ink"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Small read only field with a copy button, for the credentials and the
// sign in link. Falls back silently if the browser refuses clipboard
// access, which it does on any page not served over https.
export function CopyField({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // Nothing useful to say here. The value is on screen and selectable.
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted">{label}</label>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={value}
          onFocus={(e) => e.currentTarget.select()}
          className="min-w-0 flex-1 rounded-xl border border-border bg-surface2 px-3 py-2 font-mono text-xs text-ink"
        />
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-xl border border-border bg-surface2 px-3 py-2 text-xs font-medium text-ink hover:bg-surface2/70"
        >
          Copy
        </button>
      </div>
      {hint && <p className="text-xs text-faint">{hint}</p>}
    </div>
  );
}
