import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata = {
  title: "Get Started — Between Us",
  description: "Tell us what brings you here and find your circle.",
};

export default async function OnboardingPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  // Middleware already gates this route to logged-in users, but guard here
  // too in case this ever renders outside that path.
  if (!user) redirect("/login");
  // A profile without a circle_id hasn't actually finished onboarding —
  // matches the completion check in /circle to avoid a redirect loop.
  if (profile && profile.circle_id) redirect("/circle");

  // Re-checked here rather than trusted from the invite route, since
  // time may have passed between the two requests. Anyone without a
  // valid token falls straight through to the normal 8 screen wizard,
  // which is untouched by any of this.
  const inviteToken = cookies().get("invite_token")?.value ?? null;
  let invited = false;
  if (inviteToken) {
    const admin = createAdminClient();
    const { data: invite } = await admin
      .from("invite_links")
      .select("expires_at, max_uses, use_count")
      .eq("token", inviteToken)
      .maybeSingle();
    invited =
      !!invite &&
      new Date(invite.expires_at).getTime() > Date.now() &&
      invite.use_count < invite.max_uses;
  }

  return (
    <main className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <OnboardingWizard invited={invited} />
      </div>
    </main>
  );
}
