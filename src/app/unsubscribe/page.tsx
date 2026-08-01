import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card } from "@/components/ui/Card";

export const metadata = {
  title: "Unsubscribe — Between Us",
  description: "Manage your Between Us email preferences.",
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: { u?: string };
}) {
  const userId = searchParams.u;

  if (userId) {
    const admin = createAdminClient();
    await admin
      .from("users")
      .update({ email_marketing_consent: false, email_marketing_consent_date: null })
      .eq("id", userId);
  }

  return (
    <main className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Card className="text-center">
          <h1 className="text-xl font-semibold text-ink">You have been unsubscribed.</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            You will no longer receive email updates from Between Us.
          </p>
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
