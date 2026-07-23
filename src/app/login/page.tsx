import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Log In — Between Us",
  description: "Log in to your Between Us account.",
};

export default async function LoginPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (user && profile?.circle_id) redirect("/circle");
  if (user && !profile?.circle_id) redirect("/onboarding");

  return (
    <main className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </main>
  );
}
