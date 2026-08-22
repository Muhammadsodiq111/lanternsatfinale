import { useEffect, useState } from "react";

import lantern from "@/assets/lantern.png";
import { GetStartedButton } from "@/components/get-started-button";

const links = [
  { label: "Features", href: "#features" },
  { label: "Mission", href: "#guided" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-cream/90 backdrop-blur-md shadow-[0_1px_0_0_var(--border)]" : "bg-transparent"
      }`}
    >
      <nav className="mx-auto grid max-w-7xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 sm:flex sm:justify-between">
        <a href="#top" className="flex min-w-0 items-center gap-2">
          <img
            src={lantern}
            alt="LanternSAT lantern mascot"
            width={912}
            height={1200}
            className="h-7 w-auto shrink-0"
          />
          <span className="font-display truncate text-xl font-semibold text-primary">
            LanternSAT
          </span>
        </a>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className="text-sm font-medium text-foreground/80 transition-colors hover:text-primary"
            >
              {l.label}
            </a>
          ))}
          <GetStartedButton className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5" />
        </div>

        <GetStartedButton className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground md:hidden" />
      </nav>
    </header>
  );
}
