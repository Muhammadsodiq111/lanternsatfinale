import lantern from "@/assets/lantern.png";
import { GetStartedButton } from "@/components/get-started-button";
import { TELEGRAM_URL } from "@/lib/links";
import { Reveal } from "./reveal";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden bg-sky pt-20 pb-32 text-center">
      <Reveal className="mx-auto max-w-3xl px-5">
        <h2 className="font-display text-4xl leading-tight font-semibold text-ink sm:text-5xl">
          Ready to <span className="text-primary underline-swipe">light up the SAT®?</span>
        </h2>
        <GetStartedButton className="btn-pop mt-10 inline-block bg-primary px-9 py-4 text-base text-primary-foreground" />
      </Reveal>

      <img
        src={lantern}
        alt=""
        aria-hidden="true"
        loading="lazy"
        width={912}
        height={1200}
        className="animate-float-soft pointer-events-none absolute -bottom-10 left-1/2 w-40 -translate-x-1/2 opacity-25"
      />
    </section>
  );
}

const cols = [
  { title: "PLATFORM", items: ["Features", "Free", "Proof", "Mission", "SAT basics"] },
  {
    title: "COMMUNITY",
    items: ["Telegram", "Contact", "Instagram", "Careers"],
    hrefs: { Telegram: TELEGRAM_URL } as Record<string, string>,
  },
  { title: "LEGAL", items: ["Privacy", "Terms", "Subprocessors"] },
];

export function Footer() {
  return (
    <footer className="bg-cream py-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2">
            <img
              src={lantern}
              alt="LanternSAT lantern mascot"
              loading="lazy"
              width={912}
              height={1200}
              className="h-7 w-auto shrink-0"
            />
            <span className="font-display text-xl font-semibold text-primary">LanternSAT</span>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">Built by students, for students.</p>
        </div>

        {cols.map((c) => (
          <div key={c.title}>
            <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground">
              {c.title}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.items.map((i) => (
                <li key={i}>
                  <a
                    href={("hrefs" in c ? c.hrefs[i] : undefined) ?? "#top"}
                    {...("hrefs" in c && c.hrefs[i]
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                    className="transition-colors hover:text-primary"
                  >
                    {i}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 max-w-6xl space-y-2 px-5 text-xs text-muted-foreground">
        <p>© 2026 LanternSAT. All rights reserved.</p>
        <p>
          SAT® is a registered trademark of the College Board, which is not affiliated with
          LanternSAT.
        </p>
      </div>
    </footer>
  );
}
