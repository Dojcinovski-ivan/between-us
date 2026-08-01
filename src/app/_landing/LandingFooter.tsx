import Link from "next/link";
import { LogoMark } from "./LogoMark";
import { SocialIcons } from "./SocialIcons";
import { CookieSettingsLink } from "@/components/CookieSettingsLink";

export function LandingFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-14">
        <span className="flex items-center gap-2.5">
          <LogoMark className="h-8 w-8 text-accent" />
          <span className="font-display text-xl text-ink">Between Us</span>
        </span>

        <p className="max-w-xl text-sm leading-relaxed text-muted">
          Between Us is a peer support community, not a mental health service.
          <br />
          In crisis right now? Visit{" "}
          <a
            href="https://findahelpline.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline underline-offset-4"
          >
            findahelpline.com
          </a>{" "}
          to find help in your country.
        </p>

        <div className="flex flex-col items-start gap-3 text-sm text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
          <Link href="/blog" className="hover:text-ink">
            Blog
          </Link>
          <Link href="/guidelines" className="hover:text-ink">
            Guidelines
          </Link>
          <Link href="/resources" className="hover:text-ink">
            Resources
          </Link>
          <Link href="/privacy" className="hover:text-ink">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-ink">
            Terms
          </Link>
          <CookieSettingsLink className="hover:text-ink" />
          <Link href="/login" className="hover:text-ink">
            Log in
          </Link>
          <div className="flex items-center gap-4 sm:ml-auto">
            <span>© {new Date().getFullYear()} Between Us</span>
            <SocialIcons />
          </div>
        </div>
      </div>
    </footer>
  );
}
