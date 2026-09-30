"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { exportDataFor, eraseAccountFor } from "@/lib/account";

// Articles 15, 17 and 20: the member's own copy of their data, and the
// erasure of it, without either one depending on somebody reading an
// inbox. Both re-check the caller's session rather than trusting an id
// from the request, since a server action is a plain request anyone can
// shape. The logic lives in account.ts, shared with the iOS app.

async function currentUserId(): Promise<string | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function exportMyData(): Promise<{ ok: boolean; data?: string; error?: string }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Your session expired. Please log in again." };
  return exportDataFor(userId);
}

export async function eraseAccount(): Promise<{ ok: boolean; error?: string }> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Your session expired. Please log in again." };
  return eraseAccountFor(userId);
}

export async function eraseAccountAndSignOut() {
  const result = await eraseAccount();
  if (!result.ok) return result;

  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/?erased=1");
}
