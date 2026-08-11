import Link from "next/link";
import { LogoMark } from "./LogoMark";

export function LandingNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <LogoMark className="h-8 w-8 shrink-0 text-accent" />
          <span className="hidden whitespace-nowrap font-display text-xl text-ink sm:inline">Between Us</span>
        </Link>
        <div className="flex shrink-0 items-center gap-3">
          <Link href="/blog" className="hidden px-3 py-2 text-sm text-muted hover:text-ink sm:inline-block">
            Blog
          </Link>
          <Link href="/login" className="px-3 py-2 text-sm text-muted hover:text-ink">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-gradient-ember px-5 py-2.5 text-sm font-medium text-accent-text shadow-soft transition-transform duration-300 ease-calm hover:-translate-y-0.5"
          >
            Find your circle
          </Link>
        </div>
      </nav>
    </header>
  );
}
