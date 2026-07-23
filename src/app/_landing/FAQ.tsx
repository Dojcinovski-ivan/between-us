"use client";

import { useState } from "react";

const FAQS = [
  {
    question: "What is Between Us?",
    answer:
      "Between Us is a free, anonymous community where people affected by someone else's addiction, abuse, or emotional unavailability can find others who truly understand. No clinical labels, no judgment, just people who get it.",
  },
  {
    question: "Is this therapy?",
    answer:
      "No. Between Us is peer support, not therapy. You are talking with real people who have lived through something similar, not clinicians. If you are looking for professional care, our Resources page can point you toward real help.",
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
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:py-40">
      <h2 className="text-center text-4xl font-semibold text-ink">Questions you might have</h2>

      <div className="mt-14 divide-y divide-border/60">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div key={faq.question}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-center justify-between gap-3 py-6 text-left"
              >
                <span className="font-serif text-lg text-ink">{faq.question}</span>
                <span className="shrink-0 text-xl text-faint">{isOpen ? "−" : "+"}</span>
              </button>
              {isOpen && (
                <p className="-mt-2 pb-6 text-sm leading-relaxed text-muted">{faq.answer}</p>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
