import { SPARK_LABEL, type Spark } from "@/lib/circleSparks";

// A gentle opener from the team, shown above the weekly prompt for its 48
// hour window and then gone on its own.
//
// It is never attributed to a member: the only name on it is Between Us.
// It is also not a post, so there is nothing to reply to here on purpose.
// The invitation is to say something in the composer below, the same way
// any other conversation in the circle starts.
export function SparkCard({ spark }: { spark: Spark | null }) {
  if (!spark) return null;

  return (
    <div className="rounded-xl border border-sage/40 bg-sage-soft px-3 py-2.5">
      <p className="text-xs font-medium uppercase tracking-wide text-sage">{SPARK_LABEL}</p>
      <p className="mt-1.5 font-serif text-sm italic leading-relaxed text-ink">{spark.content}</p>
    </div>
  );
}
