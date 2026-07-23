import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Confirmation Link Expired — Between Us",
  robots: { index: false, follow: false },
};

export default function ConfirmErrorPage() {
  return (
    <main className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Card className="text-center">
          <h1 className="text-xl font-semibold text-ink">That link didn&apos;t work</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Confirmation links expire after a while, or this one may have
            already been used. No worries — you can just try again.
          </p>
          <Link href="/register" className="mt-6 block">
            <Button className="w-full">Create your account again</Button>
          </Link>
          <Link href="/login" className="mt-3 block text-sm text-muted hover:text-ink">
            Already confirmed? Log in
          </Link>
        </Card>
      </div>
    </main>
  );
}
