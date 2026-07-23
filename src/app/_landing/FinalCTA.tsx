import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function FinalCTA() {
  return (
    <section className="bg-[#eaf0e9] px-4 py-24 text-center sm:px-6">
      <h2 className="text-4xl font-semibold text-ink">Ready to find your people?</h2>
      <p className="mt-3 text-lg text-muted">It takes about five minutes to find your circle.</p>
      <Link href="/register" className="mt-10 inline-block">
        <Button className="px-8">Get started, it is free</Button>
      </Link>
    </section>
  );
}
