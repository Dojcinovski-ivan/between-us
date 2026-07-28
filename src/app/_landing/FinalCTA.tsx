import Link from "next/link";

export function FinalCTA() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-24">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-dusk px-6 py-14 text-center shadow-lift sm:rounded-[3rem] sm:px-8 sm:py-20">
        <div className="absolute left-1/2 top-[-6rem] h-64 w-[36rem] -translate-x-1/2 rounded-full bg-gradient-ember opacity-25 blur-[60px]" />

        <h2 className="relative text-balance font-display text-[clamp(2.25rem,4vw,3rem)] font-medium text-dusk">
          Ready to find your circle?
        </h2>
        <Link
          href="/register"
          className="relative mt-8 inline-block rounded-full bg-gradient-ember px-8 py-3.5 font-medium text-accent-text transition-transform duration-300 ease-calm hover:-translate-y-0.5"
        >
          Get started, it is free
        </Link>
      </div>
    </section>
  );
}
