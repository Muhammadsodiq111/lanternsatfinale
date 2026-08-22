import { Reveal } from "./reveal";

type Review = {
  score: number;
  gain: number;
  from: number;
  quote: string;
  name: string;
  tone: "light" | "blue" | "dark";
};

const rowOne: Review[] = [
  {
    score: 1540,
    gain: 250,
    from: 1290,
    quote:
      "gotta say thank you to the people who were w me on vc countless times icl, made me not lazy to improve on math at all n it was fun too",
    name: "bemon",
    tone: "blue",
  },
  {
    score: 1560,
    gain: 60,
    from: 1500,
    quote:
      "the desmos course made me complete both modules extremely early to undergo the super difficult questions with great precision. those articles were life saving.",
    name: "tawfik",
    tone: "light",
  },
  {
    score: 1500,
    gain: 240,
    from: 1260,
    quote:
      "so many great things came out of LanternSAT premium but the number 1 thing: my tutor!!! she's so easy to talk to and very on top of everything.",
    name: "leann",
    tone: "dark",
  },
  {
    score: 1520,
    gain: 180,
    from: 1340,
    quote:
      "i genuinely owe everything to LanternSAT. i had a C in alg 2, but by learning the desmos tips i consistently hit 740+ in the math section.",
    name: "riley",
    tone: "blue",
  },
  {
    score: 1550,
    gain: 250,
    from: 1300,
    quote:
      "i took the first SAT kinda carelessly, but with the study plan and the desmos guide i was able to average 1500+ on the practice tests.",
    name: "zo",
    tone: "light",
  },
];

const rowTwo: Review[] = [
  {
    score: 1540,
    gain: 460,
    from: 1080,
    quote:
      "LanternSAT challenge problems are really good. the videos boosted me to start on a higher platform.",
    name: "andrew",
    tone: "dark",
  },
  {
    score: 1490,
    gain: 430,
    from: 1060,
    quote: "went from a 1060 to 1490 in 2 1/2 months!! thx to LanternSAT and Dajo 😊",
    name: "koho",
    tone: "blue",
  },
  {
    score: 1550,
    gain: 210,
    from: 1340,
    quote: "LanternSAT is goated fr. the pro server was amazing. i gotta give it to them.",
    name: "frank",
    tone: "light",
  },
  {
    score: 1530,
    gain: 170,
    from: 1360,
    quote:
      "i grinded both the math and english challenge modules, looking at the videos and redoing them until i couldn't get them wrong again.",
    name: "jaime",
    tone: "dark",
  },
  {
    score: 1560,
    gain: 310,
    from: 1250,
    quote:
      "would definitely recommend, not just for the tools (the courses are awesome), but the community itself for always helping.",
    name: "dylan",
    tone: "light",
  },
];

function Card({ r }: { r: Review }) {
  const tone =
    r.tone === "blue"
      ? "bg-primary text-primary-foreground"
      : r.tone === "dark"
        ? "bg-ink text-primary-foreground"
        : "bg-card text-foreground";

  const sub =
    r.tone === "light" ? "text-muted-foreground" : "text-primary-foreground/70";

  return (
    <article
      className={`${tone} flex w-[340px] shrink-0 flex-col justify-between rounded-3xl p-6 shadow-[var(--shadow-card)] sm:w-[400px]`}
    >
      <div>
        <div className="flex items-center gap-4">
          <span className="font-display text-5xl font-semibold">{r.score}</span>
          <span className="h-12 w-px bg-current opacity-20" />
          <span>
            <span className="font-display block text-xl font-semibold text-emerald">
              +{r.gain}
            </span>
            <span className={`text-[10px] tracking-[0.18em] ${sub}`}>POINTS</span>
            <span className={`mt-1 block text-xs ${sub}`}>
              {r.from} → {r.score}
            </span>
          </span>
        </div>
        <p className="mt-5 text-sm leading-relaxed">“{r.quote}”</p>
      </div>
      <p className={`mt-6 text-xs font-semibold ${sub}`}>{r.name}</p>
    </article>
  );
}

export function Proof() {
  return (
    <section id="proof" className="bg-sky pt-10 pb-24">
      <Reveal className="mx-auto max-w-4xl px-5 text-center">
        <h2 className="font-display text-4xl leading-tight font-semibold text-ink sm:text-5xl">
          Where students go from <span className="text-flame italic">stuck</span> to{" "}
          <span className="text-primary underline-swipe">lit.</span>
        </h2>
      </Reveal>

      <div className="mt-14 space-y-5 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_6%,#000_94%,transparent)]">
        <div className="marquee-track" style={{ ["--marquee-duration" as string]: "70s" }}>
          {[...rowOne, ...rowOne].map((r, i) => (
            <Card key={`a${i}`} r={r} />
          ))}
        </div>
        <div className="marquee-track-rev" style={{ ["--marquee-duration" as string]: "85s" }}>
          {[...rowTwo, ...rowTwo].map((r, i) => (
            <Card key={`b${i}`} r={r} />
          ))}
        </div>
      </div>

    </section>
  );
}
