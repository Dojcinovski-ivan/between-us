import Link from "next/link";
import { LandingNav } from "../_landing/LandingNav";
import { LandingFooter } from "../_landing/LandingFooter";
import { Heading, Paragraph } from "../_legal/LegalText";
import { fraunces, karla } from "@/lib/fonts";

export const metadata = {
  title: "Terms of Service — Between Us",
  description: "The terms for using Between Us, written in plain language.",
};

export default function TermsPage() {
  return (
    <main className={`landing-theme font-karla ${fraunces.variable} ${karla.variable}`}>
      <LandingNav />

      <article className="mx-auto w-full max-w-[720px] px-6 pb-24 pt-32 sm:pt-40">
        <h1 className="text-balance font-display text-[clamp(2rem,4vw,2.75rem)] font-medium text-ink">
          Terms of Service
        </h1>
        <p className="mt-3 text-sm text-faint">Last updated August 2026</p>

        <Paragraph>
          These terms are written in plain language on purpose. Think of
          this as us explaining things to a friend rather than a lawyer.
          By using Between Us you agree to what is written here.
        </Paragraph>

        <Heading>What Between Us is</Heading>
        <Paragraph>
          Between Us is a peer support community. It is a place for
          people who have been through similar experiences to find each
          other and talk. It is not a therapy service and it is not a
          medical provider. Nothing you read here should be treated as
          professional advice.
        </Paragraph>

        <Heading>Who can use it</Heading>
        <Paragraph>
          You must be eighteen years of age or older to use Between Us.
        </Paragraph>

        <Heading>How to behave here</Heading>
        <Paragraph>We ask everyone in our community to follow a few simple rules.</Paragraph>
        <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-[1.05rem] leading-[1.8] text-muted">
          <li>Be kind to other members</li>
          <li>Stay anonymous and respect the anonymity of others</li>
          <li>No harassment of any kind</li>
          <li>No clinical advice or diagnosis, this is peer support, not treatment</li>
          <li>No self promotion or advertising</li>
          <li>Never share what someone else posted here outside of Between Us</li>
        </ul>

        <Heading>What we are not responsible for</Heading>
        <Paragraph>
          We are not responsible for the content that other members post,
          for the outcome of any conversation or peer support interaction,
          or for crisis situations. If you are in crisis or need immediate
          help, please contact a mental health professional or a crisis
          line right away rather than relying on Between Us.
        </Paragraph>

        <Heading>Account termination</Heading>
        <Paragraph>
          We can remove any account that does not follow our community
          guidelines, to keep Between Us a safe place for everyone.
        </Paragraph>

        <Heading>No warranties</Heading>
        <Paragraph>
          Between Us is provided as is. We do our best to keep it
          running well, but we make no clinical guarantees and cannot
          promise the service will always be available or error free.
        </Paragraph>

        <Heading>Governing law</Heading>
        <Paragraph>
          These terms are governed by the laws of Germany, where Between
          Us is based.
        </Paragraph>

        <Heading>Contact us</Heading>
        <Paragraph>
          If you have any questions about these terms, reach out to{" "}
          <a href="mailto:hello@betweenussupport.com" className="text-ink underline underline-offset-4">
            hello@betweenussupport.com
          </a>
          .
        </Paragraph>

        <p className="mt-10 text-sm text-faint">
          See also our{" "}
          <Link href="/privacy" className="text-ink underline underline-offset-4">
            Privacy Policy
          </Link>
          .
        </p>
      </article>

      <LandingFooter />
    </main>
  );
}
