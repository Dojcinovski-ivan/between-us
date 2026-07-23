const VALUE_PROPS = [
  {
    emoji: "🔒",
    title: "Completely anonymous",
    body: "No real names. Ever. Just a username you choose.",
  },
  {
    emoji: "💙",
    title: "Peer support, not therapy",
    body: "Real people who've lived it. Not clinicians. Not chatbots.",
  },
  {
    emoji: "🌍",
    title: "Available anytime",
    body: "Your circle is there at 2am when you need it most.",
  },
];

export function ValueProps() {
  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-20 sm:px-6">
      <h2 className="text-center text-3xl font-semibold text-ink">
        What makes Between Us different
      </h2>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {VALUE_PROPS.map((v) => (
          <div key={v.title} className="text-center">
            <span className="text-3xl">{v.emoji}</span>
            <p className="mt-3 text-base font-medium text-ink">{v.title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">{v.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
