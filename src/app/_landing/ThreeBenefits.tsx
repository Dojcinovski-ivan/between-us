const BENEFITS = [
  {
    title: "Anonymous",
    body: "No real names. No profiles. Just people who understand.",
  },
  {
    title: "Peer support",
    body: "Real people who have lived what you are living. Not therapists. Not chatbots.",
  },
  {
    title: "Always here",
    body: "Your circle does not close at 5pm. It is there when you need it most.",
  },
];

export function ThreeBenefits() {
  return (
    <section id="benefits" className="px-4 py-16 sm:px-6 sm:py-24 lg:py-40">
      <div className="mx-auto grid w-full max-w-4xl grid-cols-1 gap-14 text-center sm:grid-cols-3 sm:gap-8">
        {BENEFITS.map((b) => (
          <div key={b.title}>
            <p className="text-xl font-semibold text-ink">{b.title}</p>
            <p className="mt-3 text-base leading-relaxed text-muted">{b.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
