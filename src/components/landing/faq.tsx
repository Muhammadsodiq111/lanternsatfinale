import { useState } from "react";
import { Reveal } from "./reveal";

const faqs = [
  {
    q: "Is LanternSAT really free?",
    a: "Yes. Every feature — practice questions, full-length mocks, study plans, seminars, and tutoring — is 100% free. No plans, no paywalls, no card required.",
  },
  {
    q: "How do I crack the SAT?",
    a: "The SAT is not super complicated, but it takes motivation, the right plan, enough resources, and help with confusing areas to crack it. Our platform & tutoring covers all of that.",
  },
  {
    q: "How do I make the most out of LanternSAT?",
    a: "Start with a mock exam, and use that to create a study plan. Follow it consistently, use the support of the pro community/tutors, and attend the seminars!",
  },
  {
    q: "Why Telegram?",
    a: "Telegram is the most accessible and efficient platform for delivering resources, customizing experiences, connecting students with each other, and enabling us to tutor students 1-on-1 daily.",
  },
  {
    q: "How many times can I message my tutor?",
    a: "As many times as you want. We want you to be able to ask questions and get help whenever you need it.",
  },
  {
    q: "What are the live seminars?",
    a: "Interactive events hosted twice a week where we go over SAT questions, strategies, and various topics to help improve your score.",
  },
  {
    q: "As a parent, how can I contact you if I have questions?",
    a: "You can contact us anytime at hello@lanternsat.com.",
  },
  {
    q: "Who's behind this?",
    a: "We're students who have gone through this process ourselves, and tutors who scored in the top 1% of the Digital SAT.",
  },
];

export function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="bg-sky py-20">
      <div className="mx-auto max-w-3xl px-5">
        <Reveal className="text-center">
          <h2 className="font-display text-4xl font-semibold text-primary underline-swipe sm:text-5xl">
            FAQ
          </h2>
        </Reveal>

        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <Reveal key={f.q} delay={i * 40}>
                <div
                  className={`card-soft overflow-hidden transition-colors ${isOpen ? "ring-1 ring-primary/40" : ""}`}
                >
                  <button
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-5 text-left"
                  >
                    <span className="min-w-0 text-sm font-semibold sm:text-base">{f.q}</span>
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-lg transition-all duration-300 ${
                        isOpen
                          ? "rotate-45 bg-primary text-primary-foreground"
                          : "bg-accent text-primary"
                      }`}
                    >
                      +
                    </span>
                  </button>
                  <div
                    className="grid transition-all duration-300 ease-out"
                    style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
                  >
                    <div className="overflow-hidden">
                      <p className="border-t border-border px-6 py-5 text-sm leading-relaxed text-muted-foreground">
                        {f.a}
                      </p>
                    </div>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
