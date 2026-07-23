import { CATEGORIES } from "@/lib/categories";

const VISIBLE_CATEGORIES = CATEGORIES.filter((c) => c.slug !== "something_else");

export function CategoryShowcase() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-24 lg:py-40">
      <div className="mx-auto flex w-full max-w-4xl snap-x gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
        {VISIBLE_CATEGORIES.map((c) => (
          <div
            key={c.slug}
            className="w-56 shrink-0 snap-start rounded-2xl bg-surface2 px-5 py-4 text-center sm:w-auto"
          >
            <p className="text-sm text-ink">{c.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
