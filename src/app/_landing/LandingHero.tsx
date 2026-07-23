import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function LandingHero() {
  return (
    <section className="flex items-center justify-center px-4 py-16 text-center sm:px-6 sm:py-24 lg:py-56">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-5xl font-bold leading-[1.1] text-ink sm:text-7xl lg:text-8xl">
          You don&apos;t have to carry this alone.
        </h1>

        <p className="mx-auto mt-10 max-w-[600px] text-lg leading-relaxed text-muted">
          A free, anonymous community for people healing from someone else&apos;s
          addiction, abuse, or emotional unavailability.
        </p>
        <p className="mx-auto mt-4 max-w-[600px] text-lg leading-relaxed text-muted">
          We are not therapy. We are the space that makes therapy feel possible.
        </p>

        <div className="mt-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="w-full sm:w-auto">
            <Button className="w-full px-8">Find your circle</Button>
          </Link>
          <a href="#benefits" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full px-8">
              Learn how it works
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
