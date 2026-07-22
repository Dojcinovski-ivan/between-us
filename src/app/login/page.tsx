import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (user && profile) redirect("/circle");
  if (user && !profile) redirect("/onboarding");

  return (
    <main className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </main>
  );
}
