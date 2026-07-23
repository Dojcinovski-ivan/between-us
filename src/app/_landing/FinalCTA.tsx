import Link from "next/link";
import { Button } from "@/components/ui/Button";

export function FinalCTA() {
  return (
    <section className="bg-[#eaf0e9] px-4 py-16 text-center sm:px-6 sm:py-24 lg:py-40">
      <h2 className="text-4xl font-semibold text-ink sm:text-5xl">
        Ready to find your circle?
      </h2>
      <Link href="/register" className="mt-10 inline-block">
        <Button className="px-8">Get started, it is free</Button>
      </Link>
    </section>
  );
}
