export function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mt-10 font-display text-xl font-medium text-ink sm:text-2xl">
      {children}
    </h2>
  );
}

export function Paragraph({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 text-[1.05rem] leading-[1.8] text-muted">{children}</p>;
}
