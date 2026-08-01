import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { LandingNav } from "./_landing/LandingNav";
import { LandingHero } from "./_landing/LandingHero";
import { ThreeBenefits } from "./_landing/ThreeBenefits";
import { WhoItIsFor } from "./_landing/WhoItIsFor";
import { Testimonial } from "./_landing/Testimonial";
import { FAQ } from "./_landing/FAQ";
import { FinalCTA } from "./_landing/FinalCTA";
import { LandingFooter } from "./_landing/LandingFooter";
import { fraunces, karla } from "@/lib/fonts";

export const metadata = {
  title: "Between Us — Anonymous Peer Support for Relationship Trauma",
  description:
    "Anonymous peer support for people healing from relationships that hurt them. Free, safe, and always available.",
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
    <main className={`landing-theme font-karla ${fraunces.variable} ${karla.variable}`}>
      <LandingNav />
      <LandingHero />
      <ThreeBenefits />
      <WhoItIsFor />
      <Testimonial />
      <FAQ />
      <FinalCTA />
      <LandingFooter />
    </main>
  );
}
