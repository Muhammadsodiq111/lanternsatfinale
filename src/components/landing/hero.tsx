import lantern from "@/assets/lantern.png";
import { GetStartedButton } from "@/components/get-started-button";
import TextType from "@/components/TextType";
import { TELEGRAM_URL } from "@/lib/links";

export function Hero() {
  return (
    <section id="top" className="relative overflow-hidden bg-cream pt-32 pb-0 sm:pt-40">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative z-10">
          <h1 className="font-display text-[11vw] leading-[1.05] font-semibold tracking-tight text-ink sm:text-6xl lg:text-7xl">
            <span className="block min-h-[1.15em] text-primary">
              <TextType
                text={["Lantern SAT...", "Ez 1600!", "All For Free ;)"]}
                typingSpeed={75}
                pauseDuration={1500}
                showCursor={true}
                cursorCharacter="|"
              />
            </span>
            <span className="block">is how you light up the SAT®.</span>
          </h1>


          <p className="mt-6 text-base text-muted-foreground sm:text-lg">
            personalized prep platform + one-on-one tutoring — 100% free, forever
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <GetStartedButton className="btn-pop bg-primary px-8 py-4 text-lg tracking-wide text-primary-foreground uppercase" />
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="btn-pop btn-telegram bg-telegram px-8 py-4 text-lg tracking-wide text-primary-foreground uppercase"
            >
              Join Telegram
            </a>
          </div>


          <p className="mt-6 text-sm text-muted-foreground">
            Loved by <span className="font-semibold text-primary">200,000+</span> students
          </p>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div
            className="pointer-events-none absolute top-1/2 left-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-amber/40 blur-3xl animate-flicker"
            aria-hidden="true"
          />
          <img
            src={lantern}
            alt="Glowing lantern mascot holding a 1600 score sign"
            width={912}
            height={1200}
            className="animate-float-soft relative z-10 w-[70%] max-w-sm drop-shadow-2xl lg:w-full"
          />
          <div className="absolute right-2 bottom-16 z-20 rotate-6 rounded-2xl bg-primary px-5 py-3 text-primary-foreground shadow-lg lg:right-10">
            <span className="font-display text-2xl font-semibold">1600</span>
          </div>
        </div>
      </div>

      <div className="relative -mt-6 h-24 w-full sm:h-32">
        <svg
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full text-sky"
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M0,64 C240,120 480,8 720,40 C960,72 1200,120 1440,72 L1440,120 L0,120 Z"
          />
        </svg>
      </div>
    </section>
  );
}
