const FAQS = [
  {
    question: "What is Between Us?",
    answer:
      "Between Us is a free anonymous community where people affected by someone else's addiction, abuse, or emotional unavailability can find others who truly understand. No clinical labels, no therapists, no judgment. Just people who get it.",
  },
  {
    question: "Is this therapy?",
    answer:
      "No. Between Us is peer support, real people who have lived similar experiences supporting each other. We are not therapists and we do not provide clinical care. If you need professional support please reach out to a mental health specialist.",
  },
  {
    question: "Is it truly anonymous?",
    answer:
      "Completely. You choose your own username, never your real name. Your email, age, and location are used only to set up your account and find the right circle for you. They are never visible to other members.",
  },
  {
    question: "What if I am in crisis right now?",
    answer:
      "Please reach out for professional help right away. Between Us is peer support not crisis care. Visit findahelpline.com to find a crisis line in your country available right now.",
  },
  {
    question: "Is Between Us available in my language?",
    answer:
      "Between Us is currently available in English only. All circles are conducted in English regardless of where you are located.",
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
