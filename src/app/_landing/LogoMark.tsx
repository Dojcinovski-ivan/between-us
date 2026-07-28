export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" className={className}>
      <circle cx="20" cy="14.5" r="6" stroke="currentColor" strokeWidth="1.6" opacity="0.9" />
      <path
        d="M4 30c4.6-6.4 10-9.6 16-9.6S31.4 23.6 36 30"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.55"
      />
      <path
        d="M8 34.5c3.6-4.6 7.6-6.9 12-6.9s8.4 2.3 12 6.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
