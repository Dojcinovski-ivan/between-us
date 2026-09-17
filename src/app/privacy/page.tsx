import Link from "next/link";
import { LandingNav } from "../_landing/LandingNav";
import { LandingFooter } from "../_landing/LandingFooter";
import { Heading, Paragraph } from "../_legal/LegalText";
import { fraunces, karla } from "@/lib/fonts";
import { MINIMUM_AGE } from "@/lib/age";

export const metadata = {
  title: "Privacy Policy — Between Us",
  description: "How Between Us collects, uses, and protects your data.",
};

// INCOMPLETE ON PURPOSE, AND KNOWN.
//
// Article 13(1)(a) wants the identity and contact details of the data
// controller: the legal person who decides how this data is used. Between
// Us has no registered entity yet, so naming one here would be a false
// statement on a live page, and a placeholder would look broken to
// members. The section below therefore identifies the controller by the
// service and gives a working contact route, which is the most that can
// be said truthfully today.
//
// Fill this in the moment there is an entity, or a sole trader name and
// trading address if it stays unincorporated. Article 13(2)(d) also wants
// a named supervisory authority, which follows from where the controller
// is established, so it lands at the same time.

const CONTACT = "hello@betweenussupport.com";

function Mail() {
  return (
    <a href={`mailto:${CONTACT}`} className="text-ink underline underline-offset-4">
      {CONTACT}
    </a>
  );
}

function Bullets({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="mt-4 flex list-disc flex-col gap-2 pl-5 text-[1.05rem] leading-[1.8] text-muted">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

export default function PrivacyPage() {
  return (
    <main className={`landing-theme font-karla ${fraunces.variable} ${karla.variable}`}>
      <LandingNav />

      <article className="mx-auto w-full max-w-[720px] px-6 pb-24 pt-32 sm:pt-40">
        <h1 className="text-balance font-display text-[clamp(2rem,4vw,2.75rem)] font-medium text-ink">
          Privacy Policy
        </h1>
        <p className="mt-3 text-sm text-faint">Last updated September 2026</p>

        <Paragraph>
          Between Us takes your privacy seriously. This policy explains what
          information we collect, why we are allowed to collect it, how long
          we keep it, and the choices you have. We wrote it in plain
          language on purpose, because a community built on trust should be
          honest about how it handles your information.
        </Paragraph>

        <Heading>Who is responsible for your data</Heading>
        <Paragraph>
          Between Us, at betweenussupport.com, is the data controller for
          the information described here. That means we are the ones who
          decide what is collected and why, and we are the ones accountable
          for it. You can reach us about anything in this policy at{" "}
          <Mail />, and we will answer within one month.
        </Paragraph>

        <Heading>What we collect</Heading>
        <Paragraph>
          When you create an account we collect your email address and your
          date of birth. The date of birth is checked to confirm you are{" "}
          {MINIMUM_AGE} or over and then discarded, so we never store it.
        </Paragraph>
        <Paragraph>
          During onboarding, to match you to the right circle, we collect:
        </Paragraph>
        <Bullets
          items={[
            "The anonymous username you choose, which is the only name other members ever see",
            "Which experience feels closest to where you are right now",
            "Whether this is mostly about a parent, a partner, or someone else close to you",
            "What was going on, such as addiction, anger or control, emotional absence, or manipulation",
            "How long you have been carrying it",
            "Your age range, gender, and country",
          ]}
        />
        <Paragraph>As you use Between Us we also hold:</Paragraph>
        <Bullets
          items={[
            "The posts and replies you write inside your circle, and any drafts you have not sent",
            "Which posts you have read, so we can show you what is new",
            "An optional short bio you can write or delete at any time",
            "When you were last active, so we know whether to check in on you",
            "Whether you opted in to marketing email, and when",
            "Whether you gave us permission to hold the sensitive answers above, and when",
            "Basic technical data such as browser type and pages visited",
            "Analytics and advertising cookies, only if you choose them",
          ]}
        />

        <Heading>The sensitive parts, and why we ask permission</Heading>
        <Paragraph>
          Your answers during onboarding describe experiences of addiction,
          abuse, or emotional harm. Data protection law treats information
          like that as a special category, because of how much damage it
          could do in the wrong hands. It may not be held at all without
          your clear and specific permission.
        </Paragraph>
        <Paragraph>
          That is why onboarding asks you to explicitly agree before any of
          it is saved, as a separate question rather than something buried
          in our Terms. The legal basis is your explicit consent under
          Article 9(2)(a) of the GDPR. We use these answers for one purpose,
          matching you to a circle. They are never shown to other members,
          never used for advertising, and never shared outside Between Us.
        </Paragraph>
        <Paragraph>
          You can withdraw that permission at any time from your profile.
          Withdrawing it erases those answers. It does not undo the matching
          that already happened, and it does not affect anything done while
          the permission was in place.
        </Paragraph>

        <Heading>Why we are allowed to hold each thing</Heading>
        <Bullets
          items={[
            <>
              <strong className="text-ink">Running the service</strong> — your
              account, username, circle membership, posts and reads. Legal
              basis: performance of our contract with you, Article 6(1)(b).
            </>,
            <>
              <strong className="text-ink">Your sensitive answers</strong> —
              what you told us about your experiences. Legal basis: your
              explicit consent, Articles 6(1)(a) and 9(2)(a).
            </>,
            <>
              <strong className="text-ink">Confirming your age</strong> —
              keeping an adults only space adult. Legal basis: our legitimate
              interest in protecting children, Article 6(1)(f).
            </>,
            <>
              <strong className="text-ink">Marketing email</strong> — the
              weekly digest and the occasional note if we have not seen you.
              Legal basis: your consent, Article 6(1)(a).
            </>,
            <>
              <strong className="text-ink">Analytics and advertising cookies</strong>{" "}
              — understanding how people find and use the site. Legal basis:
              your consent, Article 6(1)(a).
            </>,
            <>
              <strong className="text-ink">Keeping circles safe</strong> —
              reports, moderation, and error logs. Legal basis: our
              legitimate interest in a safe community, Article 6(1)(f).
            </>,
          ]}
        />

        <Heading>How long we keep it</Heading>
        <Bullets
          items={[
            "Your account and profile: until you delete your account.",
            "Your sensitive onboarding answers: until you delete your account or withdraw that permission, whichever comes first.",
            "Your posts and replies: these stay in your circle even after you leave, shown as coming from a former member, because they are part of conversations other people took part in and cannot be removed without taking their history too.",
            "Drafts you never sent: deleted with your account.",
            "Error logs: twelve months, and they hold no message content.",
            "Marketing consent records: kept for as long as we rely on them, so we can show the consent was given.",
          ]}
        />

        <Heading>Your rights</Heading>
        <Paragraph>
          Under the GDPR you have the right to be told what we hold about
          you and get a copy of it, to correct it if it is wrong, to have it
          deleted, to ask us to restrict how we use it, to object to
          processing we base on legitimate interests, to receive your data
          in a portable machine readable format, and to withdraw any consent
          you have given at any time.
        </Paragraph>
        <Paragraph>
          Two of these you can do yourself, right now, from your profile
          page: download everything we hold about you as a file, and delete
          your account. For anything else, email <Mail /> and we will answer
          within one month.
        </Paragraph>
        <Paragraph>
          If you think we have handled your data badly, please tell us
          first and we will try to put it right. You also have the right to
          complain to a data protection supervisory authority. You can find
          the authority for your own country through the{" "}
          <a
            href="https://edpb.europa.eu/about-edpb/about-edpb/members_en"
            className="text-ink underline underline-offset-4"
            rel="noreferrer"
            target="_blank"
          >
            European Data Protection Board
          </a>
          .
        </Paragraph>

        <Heading>Deleting your account</Heading>
        <Paragraph>
          Go to your profile and choose Delete my account. This removes your
          email address, the name you chose here, and everything you told us
          about your experiences, permanently and immediately. It cannot be
          undone. As explained above, the posts you wrote stay in your
          circle, no longer connected to you or to any name. If you would
          rather we did it for you, email <Mail />.
        </Paragraph>

        <Heading>Marketing emails</Heading>
        <Paragraph>
          We only send marketing emails, such as a weekly digest or a note
          if we have not seen you in a while, to members who explicitly
          opted in. You can unsubscribe at any time using the link in any of
          those emails or from your profile settings. Emails required for
          the service to work, such as a welcome email, a password reset, or
          a notice that your circle has formed, are sent regardless of this
          choice, because they are not marketing.
        </Paragraph>

        <Heading>Cookies</Heading>
        <Paragraph>
          Essential cookies keep you signed in and remember your cookie
          choice. They cannot be turned off, because the site does not work
          without them, and they are not used to track you.
        </Paragraph>
        <Paragraph>
          Beyond those, we ask separately about two things, and nothing
          loads until you choose. Analytics cookies, through Google
          Analytics, let us count visits and see which pages actually help
          people. Advertising cookies, through the Meta Pixel and the X
          Pixel, let us see which ads brought people to Between Us, and they
          share data with Meta and X. You can accept one and refuse the
          other, and you can change your mind at any time by clicking Cookie
          settings in the footer.
        </Paragraph>
        <Paragraph>
          Advertising tags never run inside your circle, your profile, or
          onboarding, and they never run on the sign up, log in, or password
          pages either. What you read and write inside the community, and
          the fact that you joined at all, is never shared with Meta or X.
        </Paragraph>

        <Heading>Who else processes your data</Heading>
        <Paragraph>
          We work with a small number of service providers to run Between
          Us. Each one only processes data on our instructions, under a data
          processing agreement.
        </Paragraph>
        <Bullets
          items={[
            "Supabase — our database and account authentication",
            "Vercel — hosting the website",
            "Resend — sending our emails",
            "Google — Analytics, and Sign in with Google if you choose it",
            "Meta and X — advertising measurement, only with your consent and only on our public pages",
          ]}
        />
        <Paragraph>
          We never sell your data to anyone, for any reason, and we never
          share the contents of your circle with any of them beyond what is
          needed to store it.
        </Paragraph>

        <Heading>Where your data is held</Heading>
        <Paragraph>
          We host your data in the European Union wherever our providers
          offer it. Some of the providers above are based outside the
          European Economic Area, or may support us from outside it. Where
          data is transferred outside the EEA, we rely on the European
          Commission&rsquo;s Standard Contractual Clauses, or on an adequacy
          decision such as the EU&ndash;US Data Privacy Framework where the
          provider is certified under it. You can ask us for details of the
          safeguards in place for any specific provider at <Mail />.
        </Paragraph>

        <Heading>How we protect it</Heading>
        <Paragraph>
          Your circle is private to its members. Everything is served over
          an encrypted connection and every table in our database enforces
          row level access rules, so one member cannot read another
          member&rsquo;s data even if something else goes wrong. We collect
          as little as we can get away with, which is the most effective
          protection there is. Our error logs deliberately record no message
          content at all.
        </Paragraph>

        <Heading>Age</Heading>
        <Paragraph>
          Between Us is for adults. You must be {MINIMUM_AGE} or over, and we
          check your date of birth when you create an account. If you
          believe someone under {MINIMUM_AGE} has an account, tell us at{" "}
          <Mail /> and we will remove it. If you are under {MINIMUM_AGE} and
          going through something, findahelpline.com lists free confidential
          helplines in your country, including services for young people.
        </Paragraph>

        <Heading>Changes to this policy</Heading>
        <Paragraph>
          If we change how we handle your data in a way that matters, we
          will update the date at the top of this page and tell members by
          email before the change takes effect. If a change means we need
          your consent for something new, we will ask for it rather than
          assume it.
        </Paragraph>

        <Heading>Contact us</Heading>
        <Paragraph>
          If you have any questions about this policy or how your data is
          handled, reach out to <Mail />.
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
