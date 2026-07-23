import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth";
import { RegisterForm } from "./RegisterForm";

export const metadata = {
  title: "Create Your Account — Between Us",
  description: "Join Between Us — an anonymous peer support community.",
};

export default async function RegisterPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (user && profile?.circle_id) redirect("/circle");
  if (user && !profile?.circle_id) redirect("/onboarding");

  return (
    <main className="flex min-h-[calc(100vh-3rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <RegisterForm />
      </div>
    </main>
  );
}
