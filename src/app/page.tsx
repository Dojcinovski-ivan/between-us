import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getCurrentUserAndProfile } from "@/lib/auth";

const VALUE_PROPS = [
  {
    emoji: "🤍",
    title: "Anonymous",
    description: "No real names, no photos, no followers. Just your story, on your terms.",
  },
  {
    emoji: "🛡️",
    title: "Safe",
    description: "Every circle is moderated with care — a space built for gentleness, not judgment.",
  },
  {
    emoji: "🤝",
    title: "Understood",
    description: "Connect with people who've walked a similar road. Sometimes being believed is enough.",
  },
];

export default async function HomePage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (user && profile?.circle_id) {
    redirect("/circle");
  }
  if (user && !profile?.circle_id) {
    redirect("/onboarding");
  }

  return (
    <main className="flex min-h-[calc(100vh-3rem)] flex-col">
      <section className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Between Us
        </h1>
        <p className="mt-3 text-lg text-sage">Where your story is understood.</p>

        <p className="mt-6 max-w-md text-balance text-base leading-relaxed text-muted">
          Between Us is an anonymous peer support community for people healing
          from trauma in close relationships — a parent, a partner, a friend.
          No real names, no clinical labels, no pressure to explain yourself
          from the start. This isn&apos;t therapy — it&apos;s people who&apos;ve been there, listening.
        </p>

        <div className="mt-10 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          {VALUE_PROPS.map((v) => (
            <div
              key={v.title}
              className="rounded-2xl border border-border bg-surface p-5 text-left"
            >
              <span className="text-2xl">{v.emoji}</span>
              <p className="mt-2 text-sm font-medium text-ink">{v.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted">{v.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center gap-3">
          <Link href="/register">
            <Button className="px-8">Find your circle</Button>
          </Link>
          <Link href="/login" className="text-sm text-muted hover:text-ink">
            Already have an account? Log in
          </Link>
        </div>
      </section>

      <footer className="border-t border-border px-6 py-8 text-center">
        <p className="text-xs text-muted">
          Between Us is a peer support community, not a mental health service.
        </p>
        <Link
          href="/resources"
          className="mt-2 inline-block text-xs text-sage hover:text-sage-hover"
        >
          Need help right now? Visit our resources page
        </Link>
      </footer>
    </main>
  );
}
