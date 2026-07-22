import { InputHTMLAttributes, forwardRef } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = "", ...props }, ref) => {
    const inputId = id ?? props.name;
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-muted">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`rounded-xl border border-border bg-surface2 px-4 py-3 text-ink placeholder:text-faint focus:border-sage focus:outline-none focus:ring-1 focus:ring-sage ${className}`}
          {...props}
        />
        {hint && !error && <p className="text-xs text-faint">{hint}</p>}
        {error && <p className="text-xs text-warn">{error}</p>}
      </div>
    );
  },
);
Input.displayName = "Input";
