import Link from "next/link";

export function LandingNav() {
  return (
    <nav className="sticky top-0 z-20 bg-bg">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" className="font-serif text-2xl text-ink">
          Between Us
        </Link>
        <div className="flex items-center gap-4 sm:gap-6">
          <Link href="/login" className="text-sm text-muted hover:text-ink">
            Log in
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-text transition-colors hover:bg-accent-hover"
          >
            Find your circle
          </Link>
        </div>
      </div>
    </nav>
  );
}
