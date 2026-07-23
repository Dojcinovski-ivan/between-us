const STEPS = [
  {
    number: "1",
    title: "Share your story",
    body: "Answer a few gentle questions about what you have been through. No clinical forms. No pressure.",
  },
  {
    number: "2",
    title: "Meet your circle",
    body: "We match you with people who share your experience. Real people, anonymous names, genuine understanding.",
  },
  {
    number: "3",
    title: "Heal together",
    body: "Share when you are ready. Respond when you can. Grow through the support of people who get it.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-5xl px-4 py-24 sm:px-6">
      <h2 className="text-center text-4xl font-semibold text-ink">How it works</h2>

      <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-3 sm:gap-8">
        {STEPS.map((step) => (
          <div
            key={step.number}
            className="rounded-3xl bg-surface p-8 text-center shadow-[0_8px_30px_rgba(44,24,16,0.06)] sm:text-left"
          >
            <span className="font-serif text-3xl text-accent">{step.number}</span>
            <h3 className="mt-4 font-serif text-xl text-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
