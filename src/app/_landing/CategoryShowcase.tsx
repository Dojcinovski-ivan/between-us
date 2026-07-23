import { CATEGORIES } from "@/lib/categories";

const VISIBLE_CATEGORIES = CATEGORIES.filter((c) => c.slug !== "something_else");

export function CategoryShowcase() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
      <h2 className="text-center text-3xl font-semibold text-ink">You belong here if…</h2>

      <div className="mt-10 flex snap-x gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
        {VISIBLE_CATEGORIES.map((c) => (
          <div
            key={c.slug}
            className="w-64 shrink-0 snap-start rounded-2xl bg-surface2 p-5 sm:w-auto"
          >
            <p className="text-sm font-medium text-ink">{c.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
