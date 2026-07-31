const FAQS = [
  {
    question: "What is Between Us?",
    answer:
      "Between Us is a free, anonymous community where people affected by someone else's addiction, abuse, or emotional unavailability can find others who truly understand. No clinical labels, no judgment, just people who get it.",
  },
  {
    question: "Is this therapy?",
    answer:
      "No. Between Us is peer support, real people who have lived similar experiences. We are not therapists and we do not provide clinical care. If you need professional help please reach out to a mental health specialist.",
  },
  {
    question: "Is it truly anonymous?",
    answer:
      "Completely. You choose your own username, never your real name. We never show anyone's email, and details like your age and location are only used to match you with the right circle. They are never shown to other members.",
  },
  {
    question: "What if I am in crisis right now?",
    answer:
      "Please reach out to a professional right away. Between Us is peer support, not crisis care. You will find crisis resources in the footer of every page, or you can visit our Resources page for help specific to where you are.",
  },
];

export function FAQ() {
  return (
    <section className="mx-auto w-full max-w-2xl px-6 py-24">
      <h2 className="font-display text-[clamp(2.25rem,4vw,3rem)] font-medium text-ink">
        Questions, answered
      </h2>

      <div className="mt-10 border-t border-border">
        {FAQS.map((faq) => (
          <details key={faq.question} className="group border-b border-border py-6 sm:py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-1 text-lg text-ink marker:content-none">
              <span>{faq.question}</span>
              <span className="shrink-0 text-accent transition-transform duration-300 ease-calm group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 leading-relaxed text-muted">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
