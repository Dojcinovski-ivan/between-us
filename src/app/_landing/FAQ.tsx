"use client";

import { useState } from "react";

const FAQS = [
  {
    question: "What is Between Us?",
    answer:
      "Between Us is a free, anonymous community where people affected by someone else's addiction, abuse, or emotional unavailability can find others who truly get it — no clinical labels, no judgment, just people who understand.",
  },
  {
    question: "Is this therapy?",
    answer:
      "No. Between Us is peer support, not therapy. You're talking with real people who've lived through something similar, not clinicians. If you're looking for professional care, our Resources page can point you toward real help — but this space is about being heard by people who understand from experience.",
  },
  {
    question: "Is it really free?",
    answer:
      "Yes, completely. Between Us will always be free to join and use. No hidden fees, no premium tier for feeling understood.",
  },
  {
    question: "Is it truly anonymous?",
    answer:
      "Completely. You choose your own username — never your real name. We never show anyone's email, and things like your age and location are only used to match you with the right circle, never displayed to other members.",
  },
  {
    question: "How are circles formed?",
    answer:
      "When you join, we ask a few gentle questions about what brought you here and match you with 10–15 people who share a similar experience and stage of life. Circles stay small on purpose, so it actually feels like a community.",
  },
  {
    question: "What if I'm in crisis right now?",
    answer:
      "Please reach out to a professional right away — Between Us is peer support, not crisis care. You'll find crisis resources in the footer of every page, or visit our Resources page for help specific to where you are.",
  },
];

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-20 sm:px-6">
      <h2 className="text-center text-3xl font-semibold text-ink">Questions you might have</h2>

      <div className="mt-10 flex flex-col gap-2">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={faq.question} className="rounded-2xl border border-border bg-surface">
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span className="text-sm font-medium text-ink">{faq.question}</span>
                <span className="shrink-0 text-faint">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <p className="px-5 pb-4 text-sm leading-relaxed text-muted">{faq.answer}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
