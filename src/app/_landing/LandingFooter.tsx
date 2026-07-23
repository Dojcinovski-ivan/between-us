import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-border px-4 py-10 text-center sm:px-6">
      <p className="text-xs text-muted">
        Between Us is a peer support community, not a mental health service.
      </p>
      <p className="mt-2 text-xs text-muted">
        In crisis right now?{" "}
        <a href="tel:08001110111" className="text-crisis hover:opacity-80">
          Telefonseelsorge 0800 111 0 111
        </a>{" "}
        ·{" "}
        <a
          href="https://findahelpline.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-crisis hover:opacity-80"
        >
          findahelpline.com
        </a>
      </p>

      <div className="mt-4 flex items-center justify-center gap-4 text-xs">
        <Link href="/guidelines" className="text-muted hover:text-ink">
          Guidelines
        </Link>
        <Link href="/resources" className="text-muted hover:text-ink">
          Resources
        </Link>
        <Link href="/login" className="text-muted hover:text-ink">
          Log in
        </Link>
      </div>

      <p className="mt-6 text-xs text-faint">© 2026 Between Us</p>
    </footer>
  );
}
