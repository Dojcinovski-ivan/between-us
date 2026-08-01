const STEPS = [
  {
    num: "01",
    title: "Create your account",
    body: "Just an email and a password. No real name, ever.",
  },
  {
    num: "02",
    title: "Answer a few gentle questions",
    body: "We ask about your experience to find the circle that fits you best. There are no wrong answers.",
  },
  {
    num: "03",
    title: "Meet your circle",
    body: "Share whenever you are ready. Real people who understand are waiting for you.",
  },
];

export function ThreeBenefits() {
  return (
    <section id="how" className="mx-auto w-full max-w-6xl px-6 py-24">
      <h2 className="mb-10 text-center font-display text-[clamp(1.75rem,3vw,2.25rem)] font-medium text-ink">
        How it works
      </h2>
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[1.75rem] border border-border bg-border sm:grid-cols-3">
        {STEPS.map((b) => (
          <div key={b.title} className="bg-surface p-10 sm:p-12">
            <span className="font-display text-sm text-[rgba(196,132,106,0.7)]">{b.num}</span>
            <h3 className="mt-4 font-display text-2xl text-ink">{b.title}</h3>
            <p className="mt-3 leading-relaxed text-muted">{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
