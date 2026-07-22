import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { categoryLabel } from "@/lib/categories";
import { Card } from "@/components/ui/Card";
import { SignOutButton } from "@/components/SignOutButton";

export default async function CirclePage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  return (
    <main className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <Card className="text-center">
          <h1 className="text-xl font-semibold text-ink">
            Welcome, {profile.username}.
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            You&apos;re part of the {categoryLabel(profile.category)} circle. The
            shared feed is coming soon — for now, you&apos;re all set up.
          </p>
          <div className="mt-6 flex justify-center">
            <SignOutButton />
          </div>
        </Card>
      </div>
    </main>
  );
}
