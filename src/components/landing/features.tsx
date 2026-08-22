import type { ReactNode } from "react";
import { Reveal } from "./reveal";

function Panel({ children }: { children: ReactNode }) {
  return (
    <div className="card-soft flex min-h-[260px] items-center justify-center overflow-hidden p-6">
      {children}
    </div>
  );
}

function Row({
  title,
  accent,
  accentClass,
  body,
  cta,
  visual,
  flip,
}: {
  title: string;
  accent: string;
  accentClass: string;
  body: string;
  cta?: string;
  visual: ReactNode;
  flip?: boolean;
}) {
  return (
    <div className="grid items-center gap-8 py-14 lg:grid-cols-2 lg:gap-16">
      <Reveal className={flip ? "lg:order-2" : ""}>
        <h3 className="font-display text-3xl leading-tight font-semibold text-ink sm:text-4xl">
          {title} <span className={`${accentClass} underline-swipe`}>{accent}</span>
        </h3>
        <p className="mt-4 max-w-md text-muted-foreground">{body}</p>
        {cta ? (
          <a
            href="#guided"
            className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
          >
            {cta}
          </a>
        ) : null}
      </Reveal>
      <Reveal delay={90} className={flip ? "lg:order-1" : ""}>
        <Panel>{visual}</Panel>
      </Reveal>
    </div>
  );
}

const topics = [
  "Linear equations",
  "Desmos tricks",
  "Circle geometry",
  "Rhetorical synthesis",
  "Punctuation",
  "Trig ratios",
];

export function Features() {
  return (
    <section id="features" className="bg-sky pb-10">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-3xl pt-10 pb-6 text-center">
          <h2 className="font-display text-4xl leading-tight font-semibold text-ink sm:text-5xl">
            All the tools you need,
            <br />
            <span className="text-primary underline-swipe">in one spot.</span>
          </h2>
        </Reveal>

        <Row
          title="Courses built by"
          accent="top scorers."
          accentClass="text-primary"
          body="All math and reading & writing topics explained simply for any score level."
          visual={
            <ul className="grid w-full gap-2 sm:grid-cols-2">
              {topics.map((t, i) => (
                <li
                  key={t}
                  className="flex items-center gap-3 rounded-xl bg-accent px-4 py-3 text-sm font-medium"
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0 truncate">{t}</span>
                </li>
              ))}
            </ul>
          }
        />

        <Row
          flip
          title="Desmos,"
          accent="embedded everywhere."
          accentClass="text-emerald"
          body="A full Desmos course and Desmos explanations for every math problem, right where you need them."
          visual={
            <div className="relative h-56 w-full rounded-xl bg-[repeating-linear-gradient(0deg,var(--border)_0_1px,transparent_1px_28px),repeating-linear-gradient(90deg,var(--border)_0_1px,transparent_1px_28px)]">
              <svg viewBox="0 0 300 200" className="h-full w-full text-emerald">
                <path
                  d="M10 190 C 90 190 120 40 290 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx="180" cy="72" r="7" className="fill-primary" />
              </svg>
            </div>
          }
        />

        <Row
          title="4,000+ questions."
          accent="Each handcrafted."
          accentClass="text-violet"
          body="Made with extreme care and rigorous vetting, with answers explained simply."
          visual={
            <div className="w-full space-y-3">
              <p className="text-sm font-medium">
                If f(x) = 3x − 7, what is the value of f(5)?
              </p>
              {["5", "8", "15", "22"].map((o, i) => (
                <div
                  key={o}
                  className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 text-sm ${
                    i === 1
                      ? "border-emerald bg-emerald/10 font-semibold"
                      : "border-border bg-card"
                  }`}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-xs">
                    {String.fromCharCode(65 + i)}
                  </span>
                  {o}
                </div>
              ))}
            </div>
          }
        />

        <Row
          flip
          title="See every"
          accent="weak spot."
          accentClass="text-amber"
          body="Our analytics go deeper than College Board, breaking topics into specific subtopics so you know exactly where to focus."
          visual={
            <div className="w-full space-y-4">
              {[
                { l: "Algebra", v: 88 },
                { l: "Advanced Math", v: 61 },
                { l: "Geometry & Trig", v: 43 },
                { l: "Information & Ideas", v: 76 },
              ].map((b) => (
                <div key={b.l}>
                  <div className="flex justify-between text-xs font-medium text-muted-foreground">
                    <span>{b.l}</span>
                    <span>{b.v}%</span>
                  </div>
                  <div className="mt-1.5 h-2.5 rounded-full bg-accent">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${b.v}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          }
        />

        <Row
          title="10+"
          accent="full-length mocks."
          accentClass="text-flame"
          body="Comprehensive, full-length practice exams with in-depth performance analytics after every test."
          cta="Start your first mock →"
          visual={
            <div className="grid w-full grid-cols-2 gap-3">
              {["Mock #1", "Mock #2", "Mock #3", "Mock #4"].map((m, i) => (
                <div key={m} className="rounded-xl border border-border p-4">
                  <p className="text-xs text-muted-foreground">{m}</p>
                  <p className="font-display text-3xl font-semibold text-ink">
                    {[1320, 1410, 1480, 1540][i]}
                  </p>
                </div>
              ))}
            </div>
          }
        />

        <Row
          flip
          title="A plan that"
          accent="adapts."
          accentClass="text-primary"
          body="Adapts to your weak areas each week. If you follow this study plan consistently, you WILL improve."
          visual={
            <div className="w-full space-y-2">
              {["Mon · Desmos drills", "Tue · Circle geometry", "Wed · Punctuation set", "Thu · Timed module", "Fri · Mistake log review"].map(
                (d, i) => (
                  <div
                    key={d}
                    className="flex items-center gap-3 rounded-lg bg-accent px-4 py-2.5 text-sm"
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${i < 2 ? "bg-emerald" : "bg-border"}`}
                    />
                    <span className="min-w-0 truncate">{d}</span>
                  </div>
                ),
              )}
            </div>
          }
        />

        <Row
          title="AI trained on"
          accent="your prep."
          accentClass="text-violet"
          body="Prof. Ember has full context of your prep history, trained on the hardest questions and the exact tactics we teach."
          visual={
            <div className="w-full space-y-3 text-sm">
              <p className="ml-auto w-fit max-w-[80%] rounded-2xl bg-primary px-4 py-2 text-primary-foreground">
                why is the answer B here?
              </p>
              <p className="w-fit max-w-[85%] rounded-2xl bg-accent px-4 py-2">
                you distributed the 3 but forgot the −7. f(5) = 15 − 7 = 8 ✨
              </p>
            </div>
          }
        />

        <Row
          flip
          title="Never miss the"
          accent="same question twice."
          accentClass="text-flame"
          body="Automatically track everything in your mistake log. Review them before your bucket is full..."
          visual={
            <div className="w-full space-y-2">
              {["Circle equations", "Subject-verb agreement", "Exponential growth"].map((m) => (
                <div
                  key={m}
                  className="flex items-center justify-between rounded-lg border border-border px-4 py-3 text-sm"
                >
                  <span className="min-w-0 truncate">{m}</span>
                  <span className="shrink-0 rounded-full bg-flame/10 px-2.5 py-1 text-[11px] font-semibold text-flame">
                    review
                  </span>
                </div>
              ))}
            </div>
          }
        />

        <Reveal className="pb-16 text-center">
          <h3 className="font-display text-3xl font-semibold text-ink">And everything else.</h3>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {["Vocab", "Reading", "Tracker", "More coming soon"].map((t) => (
              <span
                key={t}
                className="rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
