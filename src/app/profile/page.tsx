import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { categoryLabel } from "@/lib/categories";
import { stageLabel } from "@/lib/stages";
import { Card } from "@/components/ui/Card";
import { SignOutButton } from "@/components/SignOutButton";
import { BioEditor } from "./BioEditor";

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) redirect("/login");
  if (!profile || !profile.circle_id) redirect("/onboarding");

  const memberSince = new Date(profile.created_at).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <main className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-md flex-col px-4 py-10 sm:px-6">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/circle" className="text-sm text-muted hover:text-ink">
          ← Back to your circle
        </Link>
        <SignOutButton />
      </header>

      <Card>
        <h1 className="text-xl font-semibold text-ink">{profile.username}</h1>
        <p className="mt-1 text-sm text-muted">Member since {memberSince}</p>

        <div className="mt-5 flex flex-col gap-3 border-y border-border py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-faint">Circle</p>
            <p className="mt-0.5 text-sm text-ink">{categoryLabel(profile.category)}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-faint">Stage</p>
            <p className="mt-0.5 text-sm text-ink">{stageLabel(profile.current_stage)}</p>
          </div>
        </div>

        <div className="mt-5">
          <BioEditor userId={user.id} initialBio={profile.bio} />
        </div>
      </Card>
    </main>
  );
}
