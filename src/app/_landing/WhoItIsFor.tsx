import Image from "next/image";
import { CATEGORIES } from "@/lib/categories";

export function WhoItIsFor() {
  return (
    <section className="relative isolate overflow-hidden py-28">
      <Image
        src="/landing/who.jpg"
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        className="-z-10 object-cover opacity-70"
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-bg via-[rgba(247,243,238,0.7)] to-bg" />

      <div className="mx-auto w-full max-w-4xl px-6">
        <h2 className="font-display text-[clamp(2.25rem,4vw,3rem)] font-medium text-ink">
          Who it is for
        </h2>

        <ul className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CATEGORIES.map((c) => (
            <li
              key={c.slug}
              className="flex items-start gap-3 rounded-2xl border border-[rgba(232,221,212,0.7)] bg-[rgba(255,255,255,0.8)] px-5 py-4 backdrop-blur-md transition-transform duration-300 ease-calm hover:-translate-y-0.5"
            >
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span className="text-ink">{c.description}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
