import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function LandingNav() {
  return (
    <nav className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
      <Link href="/" className="text-xl font-semibold text-ink">
        Between Us
      </Link>
      <div className="flex items-center gap-4 sm:gap-6">
        <Link href="/login" className="text-sm text-muted hover:text-ink">
          Log in
        </Link>
        <Link href="/register">
          <Button className="px-4 py-2.5 text-sm">Find your circle</Button>
        </Link>
      </div>
    </nav>
  );
}
