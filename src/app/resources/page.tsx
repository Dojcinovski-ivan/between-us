import Link from "next/link";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "Resources & Support — Between Us",
  description: "Crisis lines, books, and support links for people healing from relationship trauma.",
};

type DbResource = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  url: string | null;
};

export default async function ResourcesPage() {
  const { profile } = await getCurrentUserAndProfile();
  const supabase = createClient();

  const { data: resources } = await supabase
    .from("resources")
    .select("id, title, type, description, url")
    .order("created_at", { ascending: true });

  const books = ((resources as DbResource[]) ?? []).filter((r) => r.type === "book");
  const links = ((resources as DbResource[]) ?? []).filter((r) => r.type === "link");

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col px-4 py-10 sm:px-6">
      <Link
        href={profile ? "/circle" : "/"}
        className="mb-6 w-fit text-sm text-muted hover:text-ink"
      >
        {profile ? "← Back to your circle" : "← Back home"}
      </Link>

      <h1 className="text-2xl font-semibold text-ink">Resources</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        A few things that have helped others on this road — for whenever you need them.
      </p>

      {/* Crisis resources are always hardcoded — never dependent on the database. */}
      <div className="mt-6 rounded-2xl border-2 border-sage/50 bg-sage-soft p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-sage">If you need help right now</p>
        <div className="mt-3 flex flex-col gap-3">
          <div>
            <p className="text-sm font-medium text-ink">Germany — Telefonseelsorge</p>
            <a
              href="tel:08001110111"
              className="text-lg font-semibold text-sage hover:text-sage-hover"
            >
              0800 111 0 111
            </a>
            <p className="text-xs text-muted">Free, confidential, available 24/7.</p>
          </div>
          <div>
            <p className="text-sm font-medium text-ink">Anywhere else</p>
            <a
              href="https://findahelpline.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-sage hover:text-sage-hover"
            >
              findahelpline.com
            </a>
            <p className="text-xs text-muted">A directory of crisis lines around the world.</p>
          </div>
        </div>
      </div>

      {books.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-muted">A few books people here have found helpful</h2>
          <Card className="mt-3 divide-y divide-border p-0">
            {books.map((book) => (
              <div key={book.id} className="p-4">
                <p className="text-sm font-medium text-ink">{book.title}</p>
                {book.description && <p className="text-xs text-muted">{book.description}</p>}
              </div>
            ))}
          </Card>
        </section>
      )}

      {links.length > 0 && (
        <section className="mt-8 mb-10">
          <h2 className="text-sm font-medium text-muted">Other places that might help</h2>
          <Card className="mt-3 divide-y divide-border p-0">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 hover:bg-surface2"
              >
                <p className="text-sm font-medium text-sage">{link.title}</p>
                {link.description && <p className="text-xs text-muted">{link.description}</p>}
              </a>
            ))}
          </Card>
        </section>
      )}
    </main>
  );
}
