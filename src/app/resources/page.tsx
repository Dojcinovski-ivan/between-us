import Link from "next/link";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { Card } from "@/components/ui/Card";

const BOOKS = [
  { title: "The Body Keeps the Score", author: "Bessel van der Kolk" },
  { title: "Adult Children of Emotionally Immature Parents", author: "Lindsay Gibson" },
  { title: "Running on Empty", author: "Jonice Webb" },
  { title: "Waking the Tiger", author: "Peter Levine" },
  { title: "The Myth of Normal", author: "Gabor Maté" },
];

const LINKS = [
  { label: "Al-Anon", description: "Support for people affected by someone else's drinking.", url: "https://al-anon.org" },
  { label: "Find a therapist in Germany", description: "Directory of licensed therapists.", url: "https://therapie.de" },
  { label: "Gambling addiction support", description: "Support for people affected by gambling addiction.", url: "https://anonymous-gamblers.de" },
];

export default async function ResourcesPage() {
  const { profile } = await getCurrentUserAndProfile();

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

      <section className="mt-8">
        <h2 className="text-sm font-medium text-muted">A few books people here have found helpful</h2>
        <Card className="mt-3 divide-y divide-border p-0">
          {BOOKS.map((book) => (
            <div key={book.title} className="p-4">
              <p className="text-sm font-medium text-ink">{book.title}</p>
              <p className="text-xs text-muted">{book.author}</p>
            </div>
          ))}
        </Card>
      </section>

      <section className="mt-8 mb-10">
        <h2 className="text-sm font-medium text-muted">Other places that might help</h2>
        <Card className="mt-3 divide-y divide-border p-0">
          {LINKS.map((link) => (
            <a
              key={link.url}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 hover:bg-surface2"
            >
              <p className="text-sm font-medium text-sage">{link.label}</p>
              <p className="text-xs text-muted">{link.description}</p>
            </a>
          ))}
        </Card>
      </section>
    </main>
  );
}
