import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { LandingNav } from "./_landing/LandingNav";
import { LandingHero } from "./_landing/LandingHero";
import { ThreeBenefits } from "./_landing/ThreeBenefits";
import { CategoryShowcase } from "./_landing/CategoryShowcase";
import { Testimonial } from "./_landing/Testimonial";
import { FAQ } from "./_landing/FAQ";
import { FinalCTA } from "./_landing/FinalCTA";
import { LandingFooter } from "./_landing/LandingFooter";

export const metadata = {
  title: "Between Us: Where Your Story Is Understood",
  description:
    "Between Us is a free, anonymous peer support community for people affected by addiction, abuse, or emotional unavailability in their closest relationships. We are not therapy. We are the space that makes therapy feel possible.",
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
      <ThreeBenefits />
      <CategoryShowcase />
      <Testimonial />
      <FAQ />
      <FinalCTA />
      <LandingFooter />
    </main>
  );
}
