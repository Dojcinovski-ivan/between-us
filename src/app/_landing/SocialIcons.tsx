function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path d="M18.3 2H21l-6.7 7.6L22 22h-6.6l-5.2-6.8L4 22H1.3l7.2-8.2L1 2h6.7l4.7 6.2L18.3 2Zm-1.2 18h1.5L7 4h-1.6l11.7 16Z" />
    </svg>
  );
}

export function SocialIcons() {
  return (
    <div className="flex items-center gap-4">
      <a
        href="https://instagram.com/betweenusapp"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Between Us on Instagram"
        className="text-faint transition-colors hover:text-ink"
      >
        <InstagramIcon />
      </a>
      <a
        href="https://x.com/betweenusapp"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Between Us on X"
        className="text-faint transition-colors hover:text-ink"
      >
        <XIcon />
      </a>
    </div>
  );
}
