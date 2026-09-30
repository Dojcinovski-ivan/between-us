import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { categoryLabel } from "@/lib/categories";
import { stageLabel } from "@/lib/stages";
import { Card } from "@/components/ui/Card";
import { SignOutButton } from "@/components/SignOutButton";
import { BioEditor } from "./BioEditor";
import { EmailPreferences } from "./EmailPreferences";
import { DataAndAccount } from "./DataAndAccount";
import { BlockedMembers, type BlockedMember } from "./BlockedMembers";

export const metadata = {
  title: "Your Profile — Between Us",
  description: "View and edit your anonymous profile.",
};

export default async function ProfilePage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (!user) redirect("/login");
  if (!profile || !profile.circle_id) redirect("/onboarding");

  // Null when the user_blocks table isn't there yet (migration 0030), in
  // which case the section is simply left out rather than showing an error.
  const { data: blockRows, error: blocksError } = await createClient()
    .from("user_blocks")
    .select("blocked_id, blocked:users!user_blocks_blocked_id_fkey(username)")
    .eq("blocker_id", user.id)
    .order("created_at", { ascending: false });

  const blockedMembers: BlockedMember[] | null = blocksError
    ? null
    : ((blockRows ?? []) as unknown as { blocked_id: string; blocked: { username: string } | null }[]).map(
        (row) => ({ blockedId: row.blocked_id, username: row.blocked?.username ?? "former member" }),
      );

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

        <div className="mt-5 border-t border-border pt-5">
          <EmailPreferences
            userId={user.id}
            initialConsent={profile.email_marketing_consent ?? false}
          />
        </div>

        {blockedMembers && (
          <div className="mt-5 border-t border-border pt-5">
            <BlockedMembers userId={user.id} initialMembers={blockedMembers} />
          </div>
        )}

        <div className="mt-5 border-t border-border pt-5">
          <DataAndAccount />
        </div>
      </Card>

      <p className="mt-6 text-center text-xs text-faint">
        <Link href="/privacy" className="hover:text-muted">
          Privacy Policy
        </Link>
        {" · "}
        <Link href="/terms" className="hover:text-muted">
          Terms
        </Link>
      </p>
    </main>
  );
}
