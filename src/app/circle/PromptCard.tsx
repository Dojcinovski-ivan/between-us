import { Button } from "@/components/ui/Button";

type Prompt = {
  id: string;
  content: string;
};

export function PromptCard({
  prompt,
  onRespond,
}: {
  prompt: Prompt | null;
  onRespond: () => void;
}) {
  if (!prompt) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface/50 p-5 text-center">
        <p className="text-sm text-muted">
          No prompt for this circle yet — but you can still share whatever&apos;s on your mind below.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sage/40 bg-sage-soft p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-sage">This week&apos;s prompt</p>
      <p className="mt-2 text-base leading-relaxed text-ink">{prompt.content}</p>
      <Button onClick={onRespond} className="mt-4">
        Respond to this prompt
      </Button>
    </div>
  );
}
