import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { CATEGORIES, categoryLabel, type CategoryOption } from "@/lib/categories";

// The admin content dropdowns (weekly prompts, daily advice, resources) are
// driven by this instead of the static CATEGORIES list alone. A circle can
// exist on a slug that list does not know about — a retired taxonomy slug
// that still has members, or a pod created straight in the database — and
// those circles would otherwise be impossible to write a prompt or a daily
// line for. Reading the live circles table on each admin page load means a
// newly formed circle shows up in these dropdowns the next time the page is
// opened, with no code change.
export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const supabase = createAdminClient();

  const [{ data: circles }, { data: users }] = await Promise.all([
    supabase.from("circles").select("category"),
    supabase.from("users").select("category, is_admin"),
  ]);

  const options = new Map<string, CategoryOption>();
  const add = (slug: string) => {
    let option = options.get(slug);
    if (!option) {
      option = { slug, label: categoryLabel(slug), circles: 0, members: 0 };
      options.set(slug, option);
    }
    return option;
  };

  // Seed with the onboarding pods so every category stays writable even
  // before its first circle forms.
  for (const c of CATEGORIES) add(c.slug);

  for (const c of circles ?? []) {
    if (c.category) add(c.category).circles++;
  }
  // Members are counted too, so a category where people are still waiting to
  // be matched (no circle formed yet) is also visibly live.
  for (const u of users ?? []) {
    if (u.category && !u.is_admin) add(u.category).members++;
  }

  const order = new Map(CATEGORIES.map((c, i) => [c.slug as string, i]));
  return Array.from(options.values()).sort((a, b) => {
    // Categories with real circles first, then ones with waiting members,
    // then the remaining pods in their canonical order.
    if (b.circles !== a.circles) return b.circles - a.circles;
    if (b.members !== a.members) return b.members - a.members;
    const ai = order.get(a.slug) ?? Number.MAX_SAFE_INTEGER;
    const bi = order.get(b.slug) ?? Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return a.label.localeCompare(b.label);
  });
}
