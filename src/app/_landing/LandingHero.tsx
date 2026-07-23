import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden px-4 py-20 text-center sm:px-6 sm:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 bg-sage opacity-[0.12] blur-3xl"
        style={{ borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 bg-accent opacity-[0.10] blur-3xl"
        style={{ borderRadius: "40% 60% 70% 30% / 50% 60% 40% 50%" }}
      />

      <div className="relative mx-auto max-w-2xl">
        <h1 className="text-4xl font-semibold leading-tight text-ink sm:text-5xl">
          You don&apos;t have to carry this alone.
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-balance text-base leading-relaxed text-muted">
          Between Us is a free, anonymous community for people healing from
          the impact of someone else&apos;s addiction, abuse, or emotional
          unavailability. Find people who truly understand.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="w-full sm:w-auto">
            <Button className="w-full px-8">Find your circle →</Button>
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
