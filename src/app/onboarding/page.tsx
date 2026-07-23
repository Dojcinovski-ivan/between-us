import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { OnboardingWizard } from "./OnboardingWizard";

export default async function OnboardingPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  // Middleware already gates this route to logged-in users, but guard here
  // too in case this ever renders outside that path.
  if (!user) redirect("/login");
  // A profile without a circle_id hasn't actually finished onboarding —
  // matches the completion check in /circle to avoid a redirect loop.
  if (profile && profile.circle_id) redirect("/circle");

  return (
    <main className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md">
        <OnboardingWizard />
      </div>
    </main>
  );
}
