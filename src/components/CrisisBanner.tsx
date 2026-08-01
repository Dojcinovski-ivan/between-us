import Link from "next/link";
import { INTERNATIONAL_FALLBACK } from "@/lib/crisisResources";

export function CrisisBanner() {
  return (
    <div className="border-t border-border bg-surface/80 px-4 py-2.5 text-center text-xs text-muted backdrop-blur">
      <span>In crisis right now? Visit </span>
      <a
        href={INTERNATIONAL_FALLBACK.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-crisis underline underline-offset-2 hover:opacity-80"
      >
        findahelpline.com
      </a>
      <span> to find help in your country.</span>
      <span> · </span>
      <Link href="/guidelines" className="text-crisis underline underline-offset-2 hover:opacity-80">
        Guidelines
      </Link>
    </div>
  );
}
