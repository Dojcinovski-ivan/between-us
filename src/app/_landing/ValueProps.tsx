function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
      <path
        d="M12 20s-7-4.5-9.5-9C1 7.5 2.5 4 6 4c2 0 3.5 1.5 4 3 .5-1.5 2-3 4-3 3.5 0 5 3.5 3.5 7-2.5 4.5-9.5 9-9.5 9z"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-7 w-7">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const VALUE_PROPS = [
  {
    Icon: LockIcon,
    title: "Completely anonymous",
    body: "No real names. Ever.",
  },
  {
    Icon: HeartIcon,
    title: "Peer support not therapy",
    body: "Real people who have lived it.",
  },
  {
    Icon: ClockIcon,
    title: "Available anytime",
    body: "Your circle is there when you need it most.",
  },
];

export function ValueProps() {
  return (
    <section className="bg-surface px-4 py-24 sm:px-6">
      <div className="mx-auto w-full max-w-5xl">
        <h2 className="text-center text-4xl font-semibold text-ink">
          What makes Between Us different
        </h2>

        <div className="mt-16 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {VALUE_PROPS.map((v) => (
            <div key={v.title} className="text-center">
              <div className="flex justify-center text-accent">
                <v.Icon />
              </div>
              <p className="mt-4 text-base font-medium text-ink">{v.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted">{v.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
