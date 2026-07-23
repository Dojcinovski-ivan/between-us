import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { LandingNav } from "./_landing/LandingNav";
import { LandingHero } from "./_landing/LandingHero";
import { HowItWorks } from "./_landing/HowItWorks";
import { CategoryShowcase } from "./_landing/CategoryShowcase";
import { ValueProps } from "./_landing/ValueProps";
import { FAQ } from "./_landing/FAQ";
import { FinalCTA } from "./_landing/FinalCTA";
import { LandingFooter } from "./_landing/LandingFooter";

export const metadata = {
  title: "Between Us — Where your story is understood",
  description:
    "An anonymous peer support community for people healing from trauma in close relationships. Not therapy — just people who've been there.",
};

export default async function HomePage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (user && profile?.circle_id) {
    redirect("/circle");
  }
  if (user && !profile?.circle_id) {
    redirect("/onboarding");
  }

  return (
    <main className="flex min-h-[calc(100vh-3rem)] flex-col">
      <LandingNav />
      <LandingHero />
      <HowItWorks />
      <CategoryShowcase />
      <ValueProps />
      <FAQ />
      <FinalCTA />
      <LandingFooter />
    </main>
  );
}
