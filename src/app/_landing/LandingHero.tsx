import Link from "next/link";
import { Button } from "@/components/ui/Button";

const COMPANY_DESCRIPTION =
  "Between Us is a free, anonymous peer support community for people affected by addiction, abuse, or emotional unavailability in their closest relationships. We are not therapy. We are the space that makes therapy feel possible.";

export function LandingHero() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-20 text-center sm:px-6">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sage opacity-[0.15] blur-3xl"
      />

      <div className="relative mx-auto max-w-2xl">
        <h1 className="text-5xl font-semibold leading-tight text-ink sm:text-6xl">
          You don&apos;t have to carry this alone.
        </h1>
        <p className="mx-auto mt-8 max-w-[600px] text-balance text-lg leading-relaxed text-muted">
          {COMPANY_DESCRIPTION}
        </p>

        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="w-full sm:w-auto">
            <Button className="w-full px-8">Find your circle</Button>
          </Link>
          <a href="#how-it-works" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full px-8">
              Learn how it works
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
