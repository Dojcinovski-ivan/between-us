import { CATEGORIES } from "@/lib/categories";

const VISIBLE_CATEGORIES = CATEGORIES.filter((c) => c.slug !== "something_else");

export function CategoryShowcase() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-24 sm:px-6">
      <h2 className="text-center text-4xl font-semibold text-ink">You belong here if…</h2>

      <div className="mt-16 flex snap-x gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-3">
        {VISIBLE_CATEGORIES.map((c) => (
          <div
            key={c.slug}
            className="w-64 shrink-0 snap-start rounded-3xl bg-surface2 p-7 text-center transition-shadow hover:shadow-[0_8px_30px_rgba(44,24,16,0.06)] sm:w-auto"
          >
            <p className="text-sm font-medium text-ink">{c.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
