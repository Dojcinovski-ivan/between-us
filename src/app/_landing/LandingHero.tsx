import Link from "next/link";
import Image from "next/image";

export function LandingHero() {
  return (
    <section className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src="/landing/hero.png"
          alt="A soft, pale illustrated desert landscape at sunrise with several small groups sitting together on the dunes"
          fill
          priority
          sizes="100vw"
          className="animate-drift object-cover"
        />
        <div className="absolute inset-0 bg-[rgba(247,243,238,0.18)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-b from-transparent to-bg" />
      </div>

      <div className="mx-auto flex min-h-[92vh] max-w-3xl flex-col items-center justify-center px-6 pb-24 pt-32 text-center">
        <p className="animate-rise mb-8 rounded-full border border-[rgba(232,221,212,0.7)] bg-[rgba(255,255,255,0.6)] px-4 py-1.5 text-[0.72rem] uppercase tracking-[0.18em] text-muted backdrop-blur-md">
          Free · Anonymous · Always open
        </p>

        <h1 className="animate-rise text-balance font-display text-[clamp(2.75rem,7vw,4.5rem)] font-medium leading-[0.98] tracking-tight text-ink">
          You don&apos;t have to carry this alone.
        </h1>

        <p className="animate-rise mt-8 max-w-xl text-lg leading-relaxed text-muted">
          A free, anonymous community for people healing from someone else&apos;s
          addiction, abuse, or emotional unavailability.
        </p>
        <p className="animate-rise mt-4 max-w-xl italic text-muted">
          We are not therapy. We are the space that makes therapy feel possible.
        </p>

        <div className="animate-rise mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="rounded-full bg-gradient-ember px-7 py-3.5 font-medium text-accent-text shadow-lift transition-transform duration-300 ease-calm hover:-translate-y-0.5"
          >
            Find your circle →
          </Link>
          <a
            href="#how"
            className="rounded-full border border-border bg-[rgba(255,255,255,0.6)] px-7 py-3.5 font-medium text-ink backdrop-blur-md transition-transform duration-300 ease-calm hover:-translate-y-0.5"
          >
            Learn how it works
          </a>
        </div>
      </div>
    </section>
  );
}
