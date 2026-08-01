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

      <div className="mx-auto flex min-h-[92vh] max-w-3xl flex-col items-center justify-center px-6 pb-16 pt-24 text-center sm:pb-24 sm:pt-32">
        <p className="animate-rise mb-8 rounded-full border border-[rgba(232,221,212,0.7)] bg-[rgba(255,255,255,0.6)] px-3 py-1 text-[0.6rem] uppercase tracking-[0.1em] text-muted backdrop-blur-md sm:px-4 sm:py-1.5 sm:text-[0.72rem] sm:tracking-[0.18em]">
          Free · Anonymous · Always open
        </p>

        <h1 className="animate-rise text-balance font-display text-[2.75rem] font-medium leading-[1.05] tracking-tight text-ink sm:text-[clamp(2.75rem,7vw,4.5rem)] sm:leading-[0.98]">
          Anonymous peer support for people healing from relationships that hurt them.
        </h1>

        <p className="animate-rise mt-8 max-w-xl italic text-muted">
          We are not therapy. We are the space that makes therapy feel possible.
        </p>

        <div className="animate-rise mt-10 flex w-full max-w-xs flex-col items-center gap-3 sm:max-w-none sm:flex-row sm:flex-wrap sm:justify-center">
          <Link
            href="/register"
            className="w-full rounded-full bg-gradient-ember px-7 py-3.5 font-medium text-accent-text shadow-lift transition-transform duration-300 ease-calm hover:-translate-y-0.5 sm:w-auto"
          >
            Find your circle →
          </Link>
          <a
            href="#how"
            className="w-full rounded-full border border-border bg-white px-7 py-3.5 font-medium text-ink shadow-soft transition-transform duration-300 ease-calm hover:-translate-y-0.5 sm:w-auto"
          >
            Learn how it works
          </a>
        </div>

        <p className="animate-rise mt-8 max-w-lg text-xs leading-relaxed text-faint">
          If you are in crisis or need professional support please reach out
          to a mental health specialist or call a crisis line.
        </p>
      </div>
    </section>
  );
}
