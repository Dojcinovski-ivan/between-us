import Link from "next/link";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "Community Guidelines — Between Us",
  description: "How we keep Between Us a kind, anonymous, and safe space.",
};

const GUIDELINES = [
  {
    title: "Be kind and supportive",
    body: "Everyone here is carrying something heavy. A little gentleness goes a long way.",
  },
  {
    title: "Stay anonymous",
    body: "Don't share your real name, workplace, city, or anything else that could identify you or someone else.",
  },
  {
    title: "No advice unless asked",
    body: "Sometimes people just need to be heard, not fixed. Ask before offering solutions.",
  },
  {
    title: "No diagnosis or clinical language",
    body: "This is peer support, not a clinical space. Speak from your own experience, not a textbook.",
  },
  {
    title: "Report anything that feels harmful",
    body: "If a post crosses a line, use the report button. A real person reviews every report.",
  },
  {
    title: "This is peer support, not therapy",
    body: "We're here to listen and understand — not to replace professional care. If you're in crisis, please reach out to a professional using the resources on this site.",
  },
];

export default async function GuidelinesPage() {
  const { profile } = await getCurrentUserAndProfile();

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-2xl flex-col px-4 py-10 sm:px-6">
      <Link
        href={profile ? "/circle" : "/"}
        className="mb-6 w-fit text-sm text-muted hover:text-ink"
      >
        {profile ? "← Back to your circle" : "← Back home"}
      </Link>

      <h1 className="text-2xl font-semibold text-ink">Community Guidelines</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        A few simple things that keep this a place worth showing up to.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {GUIDELINES.map((g) => (
          <Card key={g.title}>
            <p className="text-sm font-medium text-ink">{g.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{g.body}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
