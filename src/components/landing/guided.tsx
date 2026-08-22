import { Reveal } from "./reveal";

function Stat({ v, l }: { v: string; l: string }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold text-primary">{v}</p>
      <p className="text-[10px] tracking-[0.16em] text-muted-foreground">{l}</p>
    </div>
  );
}

function ChatShell({
  title,
  tag,
  meta,
  children,
}: {
  title: string;
  tag: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-ink shadow-[var(--shadow-card)]">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 bg-white/5 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-white/40">#</span>
          <span className="truncate text-sm font-semibold text-white">{title}</span>
          {meta ? <span className="shrink-0 text-xs text-white/40">{meta}</span> : null}
        </div>
        <span className="shrink-0 rounded bg-primary px-2 py-1 text-[10px] font-bold tracking-wider text-primary-foreground">
          {tag}
        </span>
      </div>
      <div className="space-y-3 p-4">{children}</div>
    </div>
  );
}

function Msg({
  who,
  time,
  text,
  color = "text-primary",
  badge,
}: {
  who: string;
  time: string;
  text: string;
  color?: string;
  badge?: string;
}) {
  return (
    <div className="text-sm">
      <p className="flex flex-wrap items-center gap-2">
        <span className={`font-semibold ${color}`}>{who}</span>
        {badge ? (
          <span className="rounded bg-amber/20 px-1.5 py-0.5 text-[10px] font-bold text-amber">
            {badge}
          </span>
        ) : null}
        <span className="text-[11px] text-white/35">{time}</span>
      </p>
      <p className="text-white/85">{text}</p>
    </div>
  );
}

export function Guided() {
  return (
    <section id="guided" className="bg-sky py-20">
      <div className="mx-auto max-w-6xl px-5">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl leading-tight font-semibold text-ink sm:text-5xl">
            Guided by <span className="text-primary underline-swipe">top scorers.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Live seminars, 1-on-1 tutoring, and an exclusive community.
          </p>
        </Reveal>

        <div className="grid items-center gap-8 py-14 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h3 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
              Live seminars, <span className="text-primary underline-swipe">every week.</span>
            </h3>
            <p className="mt-4 max-w-md text-muted-foreground">
              Top scorers walk through the hardest problems in real time. Drop in,{" "}
              <strong className="text-foreground">ask questions live</strong>, watch the recordings
              later.
            </p>
            <div className="mt-6 flex gap-10">
              <Stat v="2x" l="PER WEEK" />
              <Stat v="60+" l="MIN EACH" />
              <Stat v="100%" l="RECORDED" />
            </div>
          </Reveal>
          <Reveal delay={90}>
            <ChatShell title="live-seminar" tag="PRO" meta="● LIVE">
              <div className="rounded-xl bg-amber/10 p-6 text-center">
                <p className="font-display text-3xl font-semibold text-primary">
                  lantern lesson #17
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <span className="rounded-full bg-amber/25 px-3 py-1 text-xs font-semibold text-amber">
                    Right Triangle Trig
                  </span>
                  <span className="rounded-full bg-violet/25 px-3 py-1 text-xs font-semibold text-violet">
                    Inferences
                  </span>
                </div>
                <p className="mt-4 text-sm text-white/60">basics + hard problems</p>
              </div>
              <Msg who="jonah" time="" text="hi dajo ur the goat 🐐" />
              <Msg who="aarush" time="" text="omg right triangle trig lessgo" color="text-emerald" />
              <Msg who="riley" time="" text="whatup guys" color="text-amber" />
              <Msg who="bemon" time="" text="starting in a min?" color="text-violet" />
            </ChatShell>
          </Reveal>
        </div>

        <div className="grid items-center gap-8 py-14 lg:grid-cols-2 lg:gap-16">
          <Reveal className="lg:order-2">
            <h3 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
              Your own <span className="text-primary underline-swipe">top 1% tutor.</span>
            </h3>
            <p className="mt-4 max-w-md text-muted-foreground">
              Tutors, who actually took the Digital SAT, that{" "}
              <strong className="text-foreground">proactively reach out</strong> to help you
              everyday. No more waiting for Saturdays at 10am.
            </p>
            <div className="mt-6 flex gap-10">
              <Stat v="< 2hr" l="RESPONSE" />
              <Stat v="1550+" l="TUTOR SCORE" />
              <Stat v="24/7" l="ACCESS" />
            </div>
          </Reveal>
          <Reveal delay={90} className="lg:order-1">
            <ChatShell title="tutoring-dajo" tag="PREMIUM" meta="private">
              <Msg who="You" time="4:32 PM" color="text-flame" text="hey can u help me with this geometry Q? im so lost 😭" />
              <Msg who="Dajo" time="4:33 PM" text="ofc! send it over" />
              <Msg
                who="You"
                time="4:33 PM"
                color="text-flame"
                text="if a circle has center (3,−2) and passes through (7,1), whats the equation?"
              />
              <Msg
                who="Dajo"
                time="4:35 PM"
                text="find the radius first: d = √(16+9) = 5. so (x−3)² + (y+2)² = 25"
              />
              <Msg who="You" time="4:35 PM" color="text-flame" text="OHHH that makes so much sense ty 🙏" />
            </ChatShell>
          </Reveal>
        </div>

        <div className="grid items-center gap-8 py-14 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <h3 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
              Private community
              <br />
              <span className="text-primary underline-swipe">with tutors.</span>
            </h3>
            <p className="mt-4 max-w-md text-muted-foreground">
              Study alongside other students & get help from tutors and{" "}
              <strong className="text-foreground">recent top-scoring alumni</strong>.
            </p>
          </Reveal>
          <Reveal delay={90}>
            <ChatShell title="pro-community" tag="PRO">
              <Msg who="leann" time="2:14 PM" color="text-flame" text="anyone else having trouble with the challenge algebra qs?" />
              <Msg who="tawfik" time="2:15 PM" color="text-emerald" text="yeah it was tough but check out the lesson, it helped me a ton" />
              <Msg who="mekhi" time="2:18 PM" color="text-amber" text="finally broke 1500 on mock #6 😭🙏" />
              <Msg who="Dajo" time="2:20 PM" badge="TUTOR" text="congrats! almost to your 1550 goal!" />
              <p className="pt-2 text-xs font-semibold text-emerald">● 262 online now</p>
            </ChatShell>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
