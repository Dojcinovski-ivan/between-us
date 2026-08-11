import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { verifyUnsubscribeToken } from "@/lib/unsubscribeToken";
import { confirmUnsubscribe } from "./actions";

export const metadata = {
  title: "Unsubscribe — Between Us",
  description: "Manage your Between Us email preferences.",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { u?: string; t?: string; done?: string; invalid?: string };
}) {
  const userId = searchParams.u;
  const token = searchParams.t;

  const content = searchParams.done ? (
    <>
      <h1 className="text-xl font-semibold text-ink">You have been unsubscribed.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        You will no longer receive email updates from Between Us.
      </p>
    </>
  ) : searchParams.invalid || !userId || !verifyUnsubscribeToken(userId, token) ? (
    <>
      <h1 className="text-xl font-semibold text-ink">This link isn&apos;t valid.</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        It may be malformed or already used. You can manage your email preferences from your
        profile instead.
      </p>
    </>
  ) : (
    <>
      <h1 className="text-xl font-semibold text-ink">Unsubscribe from emails?</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        You&apos;ll stop receiving digest and reminder emails from Between Us. This doesn&apos;t
        affect your account or circle.
      </p>
      {/* A real click-triggered submit rather than a mutation on page load,
          so email security scanners that prefetch links in the message
          (Outlook Safe Links, corporate proxies) can't silently trigger
          this before the recipient ever opens the email. */}
      <form action={confirmUnsubscribe} className="mt-6">
        <input type="hidden" name="u" value={userId} />
        <input type="hidden" name="t" value={token} />
        <Button type="submit" className="w-full">
          Unsubscribe
        </Button>
      </form>
    </>
  );

  return (
    <main className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Card className="text-center">
          {content}
          <Link
            href="https://betweenussupport.com"
            className="mt-6 inline-block text-sm text-sage hover:text-sage-hover"
          >
            Return to betweenussupport.com
          </Link>
        </Card>
      </div>
    </main>
  );
}
