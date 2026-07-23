import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
};

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-accent text-accent-text hover:bg-accent-hover disabled:bg-accent/50 disabled:text-accent-text/70",
  secondary:
    "bg-surface2 text-ink border border-border hover:bg-surface2/70 disabled:opacity-50",
  outline:
    "bg-transparent text-accent border border-accent hover:bg-accent-soft disabled:opacity-50",
  ghost: "text-muted hover:text-ink disabled:opacity-50",
  danger:
    "bg-warn text-white hover:opacity-90 disabled:bg-warn/50 disabled:text-white/70",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-medium transition-colors disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";
