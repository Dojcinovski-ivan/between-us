const BENEFITS = [
  {
    num: "01",
    title: "Anonymous",
    body: "No real names. No profiles. Just people who understand.",
  },
  {
    num: "02",
    title: "Peer support",
    body: "Real people who have lived what you are living. Not therapists. Not chatbots.",
  },
  {
    num: "03",
    title: "Always here",
    body: "Your circle does not close at 5pm. It is there when you need it most.",
  },
];

export function ThreeBenefits() {
  return (
    <section id="how" className="mx-auto w-full max-w-6xl px-6 py-24">
      <div className="grid grid-cols-1 gap-px overflow-hidden rounded-[1.75rem] border border-border bg-border sm:grid-cols-3">
        {BENEFITS.map((b) => (
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
