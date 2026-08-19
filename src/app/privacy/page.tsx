import Link from "next/link";
import { LandingNav } from "../_landing/LandingNav";
import { LandingFooter } from "../_landing/LandingFooter";
import { Heading, Paragraph } from "../_legal/LegalText";
import { fraunces, karla } from "@/lib/fonts";

export const metadata = {
  title: "Privacy Policy — Between Us",
  description: "How Between Us collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <main className={`landing-theme font-karla ${fraunces.variable} ${karla.variable}`}>
      <LandingNav />

      <article className="mx-auto w-full max-w-[720px] px-6 pb-24 pt-32 sm:pt-40">
        <h1 className="text-balance font-display text-[clamp(2rem,4vw,2.75rem)] font-medium text-ink">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-faint">Last updated August 2026</p>

        <Paragraph>
          Between Us takes your privacy seriously. This policy explains what
          information we collect, why we collect it, and the choices you
          have. We wrote it in plain language on purpose, because a
          community built on trust should be honest about how it handles
          your information.
        </Paragraph>

        <Heading>Who we are</Heading>
        <Paragraph>
          Between Us, available at betweenussupport.com, is a peer support
          community for people healing from relationships that hurt them.
          This policy covers the information we collect through the
          website and the service.
        </Paragraph>

        <Heading>What data we collect</Heading>
        <Paragraph>We collect the following information.</Paragraph>
        <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-[1.05rem] leading-[1.8] text-muted">
          <li>Your email address, used to create and secure your account</li>
          <li>The anonymous username you choose, which is what other members see</li>
          <li>Your age range and country, used only to match you with the right circle and show relevant crisis resources</li>
          <li>The category of experience you select, used to match you with people who understand</li>
          <li>The posts and messages you share inside your circle</li>
          <li>Basic device and usage data, such as browser type and pages visited</li>
          <li>Analytics cookies, only if you give consent</li>
        </ul>

        <Heading>Why we collect it</Heading>
        <Paragraph>
          We use this information to provide the service itself, to match
          you with the circle that fits your experience, to send you
          notifications that are relevant to you, and, only with your
          consent, to understand how people use Between Us so we can
          improve it.
        </Paragraph>

        <Heading>How long we keep it</Heading>
        <Paragraph>
          We keep your account information until you delete your account.
          Posts and messages you share are kept as part of your circle
          history, since they are also part of the shared experience of
          the other members in your circle.
        </Paragraph>

        <Heading>Your rights</Heading>
        <Paragraph>
          Under the General Data Protection Regulation you have the right
          to access the personal data we hold about you, correct it if it
          is wrong, delete it, and withdraw your consent at any time. To
          exercise any of these rights, contact us at{" "}
          <a href="mailto:hello@betweenussupport.com" className="text-ink underline underline-offset-4">
            hello@betweenussupport.com
          </a>
          .
        </Paragraph>

        <Heading>How to delete your account</Heading>
        <Paragraph>
          To delete your account and the personal data associated with it,
          email us at{" "}
          <a href="mailto:hello@betweenussupport.com" className="text-ink underline underline-offset-4">
            hello@betweenussupport.com
          </a>{" "}
          and we will take care of it.
        </Paragraph>

        <Heading>Marketing emails</Heading>
        <Paragraph>
          We only send marketing emails, such as a weekly digest or a note
          if we have not seen you in a while, to members who have
          explicitly opted in. You can unsubscribe at any time using the
          link in any of those emails or from your profile settings.
          Emails required for the service to work, such as a welcome email
          or a notice that your circle has formed, are sent regardless of
          this choice, since they are not marketing.
        </Paragraph>

        <Heading>Cookies</Heading>
        <Paragraph>
          We use analytics cookies only with your consent, through Google
          Analytics and the Meta Pixel, to understand how people find and
          use Between Us. You can accept or decline this the first time you
          visit, and you can change your mind at any time by clicking
          Cookie settings in the footer of the site.
        </Paragraph>
        <Paragraph>
          The Meta Pixel runs only on our public pages, such as the home
          page and the blog. It is never active inside your circle, your
          profile, or anywhere else you are signed in, so what you read and
          write inside the community is never shared with Meta.
        </Paragraph>

        <Heading>Who we share data with</Heading>
        <Paragraph>
          We work with a small number of trusted service providers to run
          Between Us. Supabase stores our database. Resend sends our
          emails. Vercel hosts the website. Google Analytics and Meta help
          us understand usage and how people find us, only with your
          consent and only on our public pages. We never sell your data to
          anyone, for any reason.
        </Paragraph>

        <Heading>Contact us</Heading>
        <Paragraph>
          If you have any questions about this policy or how your data is
          handled, reach out to{" "}
          <a href="mailto:hello@betweenussupport.com" className="text-ink underline underline-offset-4">
            hello@betweenussupport.com
          </a>
          .
        </Paragraph>

        <p className="mt-10 text-sm text-faint">
          See also our{" "}
          <Link href="/terms" className="text-ink underline underline-offset-4">
            Terms of Service
          </Link>
          .
        </p>
      </article>

      <LandingFooter />
    </main>
  );
}
