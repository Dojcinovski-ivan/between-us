import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { getCurrentUserAndProfile } from "@/lib/auth";

export default async function HomePage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (user && profile) {
    redirect("/circle");
  }
  if (user && !profile) {
    redirect("/onboarding");
  }

  return (
    <main className="flex min-h-[calc(100vh-3rem)] flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Between Us
        </h1>
        <p className="mt-4 text-balance text-base leading-relaxed text-muted">
          A quiet, anonymous space to be heard by people who understand — no
          real names, no likes, no followers. Just people who get it.
        </p>

        <div className="mt-10 flex flex-col gap-3">
          <Link href="/register" className="w-full">
            <Button className="w-full">Get started</Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button variant="secondary" className="w-full">
              I already have an account
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
