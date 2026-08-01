import Link from "next/link";
import { CookieSettingsLink } from "./CookieSettingsLink";

export function MinimalLegalLinks() {
  return (
    <div className="mt-10 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-6 text-xs text-faint">
      <Link href="/privacy" className="hover:text-muted">
        Privacy Policy
      </Link>
      <Link href="/terms" className="hover:text-muted">
        Terms
      </Link>
      <CookieSettingsLink className="hover:text-muted" />
    </div>
  );
}
