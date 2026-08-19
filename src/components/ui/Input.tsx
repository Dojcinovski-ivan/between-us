"use client";

import { InputHTMLAttributes, forwardRef, useState } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = "", type = "text", ...props }, ref) => {
    const inputId = id ?? props.name;

    // Password fields get a reveal toggle. Typing a new password blind is
    // where people get stuck on the reset and register forms, where a typo
    // only shows up as "those passwords don't match".
    const isPassword = type === "password";
    const [revealed, setRevealed] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-muted">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={isPassword && revealed ? "text" : type}
            className={`w-full rounded-xl border border-border bg-surface2 px-4 py-3 text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage ${
              isPassword ? "pr-16" : ""
            } ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setRevealed((current) => !current)}
              aria-pressed={revealed}
              aria-controls={inputId}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md px-1.5 py-1 text-xs font-medium text-muted transition-colors hover:text-ink focus:outline-none focus:ring-1 focus:ring-sage"
            >
              {revealed ? "Hide" : "Show"}
            </button>
          )}
        </div>
        {hint && !error && <p className="text-xs text-faint">{hint}</p>}
        {error && <p className="text-xs text-warn">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
