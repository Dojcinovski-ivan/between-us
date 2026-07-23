import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function FinalCTA() {
  return (
    <section className="bg-surface2 px-4 py-20 text-center sm:px-6">
      <h2 className="text-3xl font-semibold text-ink">Ready to find your people?</h2>
      <p className="mt-3 text-base text-muted">It takes about 5 minutes to find your circle.</p>
      <Link href="/register" className="mt-8 inline-block">
        <Button className="px-8">Get started — it&apos;s free</Button>
      </Link>
    </section>
  );
}
