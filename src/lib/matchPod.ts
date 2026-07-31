import type { FeltExperienceSlug } from "@/lib/feltExperience";
import type { WhoWasItSlug } from "@/lib/whoWasIt";
import type { MechanismSlug } from "@/lib/mechanisms";
import type { CategorySlug } from "@/lib/categories";

type MatchInput = {
  feltExperience: FeltExperienceSlug;
  whoWasIt: WhoWasItSlug;
  mechanisms: MechanismSlug[];
};

// Most felt-experience answers map straight to a pod. The two ambiguous
// ones ("grew up in a home I am still recovering from" and "something
// hurts but I am not sure what") need the mechanisms and who_was_it
// answers to refine further, handled in derivePodCategory below.
const DIRECT_MATCH: Partial<Record<FeltExperienceSlug, CategorySlug>> = {
  lost_myself: "finding_way_back",
  cant_leave: "leaving_feels_impossible",
  held_together: "the_caretaker",
  loving_addict: "loving_someone",
  repeating_pattern: "understanding_patterns",
};

export function derivePodCategory({ feltExperience, whoWasIt, mechanisms }: MatchInput): CategorySlug {
  const direct = DIRECT_MATCH[feltExperience];
  if (direct) return direct;

  const has = (m: MechanismSlug) => mechanisms.includes(m);

  // Checked in this order regardless of how many mechanisms were
  // selected, since responsibility for a parent's or partner's feelings
  // is the clearest single signal for the caretaker pod even when other
  // mechanisms are also present.
  if (has("responsible_for_them")) return "the_caretaker";
  if (has("addiction")) return whoWasIt === "partner" ? "loving_someone" : "growing_up";
  if (has("anger_control")) return "when_home";
  if (has("emotionally_absent")) return "invisible_wound";
  if (has("still_in_it_hard_to_leave")) return "leaving_feels_impossible";

  // No mechanism gave a clear signal, so fall back on who this was
  // mostly about.
  switch (whoWasIt) {
    case "parent":
      return "growing_up";
    case "both":
      return "understanding_patterns";
    case "partner":
    case "someone_else":
    default:
      return "finding_way_back";
  }
}
