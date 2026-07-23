const STEPS = [
  {
    number: "1",
    title: "Tell us your story",
    body: "Answer a few gentle questions about what you've been through. No clinical forms. No pressure.",
  },
  {
    number: "2",
    title: "Meet your circle",
    body: "We match you with 10–15 people who share your experience. Real people, anonymous names, genuine understanding.",
  },
  {
    number: "3",
    title: "Heal together",
    body: "Share when you're ready. Respond when you can. Grow through the support of people who get it.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
      <h2 className="text-center text-3xl font-semibold text-ink">How it works</h2>

      <div className="mt-12 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-8">
        {STEPS.map((step) => (
          <div key={step.number} className="text-center sm:text-left">
            <span className="text-3xl font-semibold text-accent">{step.number}</span>
            <h3 className="mt-3 text-lg font-medium text-ink">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted">{step.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
