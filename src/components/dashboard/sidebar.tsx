import { Link } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  ChevronsLeft,
  ChevronsRight,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Home,
  LayoutGrid,
  Repeat2,
  Send,
  Spline,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";

import lantern from "@/assets/lantern.png";
import { TELEGRAM_URL } from "@/lib/links";

type Item = { label: string; icon: LucideIcon; badge?: string; to?: string };
type Group = { label?: string; items: Item[] };

const groups: Group[] = [
  { items: [{ label: "Home", icon: Home }] },
  {
    label: "Learn",
    items: [
      { label: "Modules", icon: LayoutGrid },
      { label: "Courses", icon: GraduationCap },
      { label: "Vocab", icon: BookOpen, to: "/vocab" },
      { label: "Reading", icon: FileText, to: "/reading" },
    ],
  },
  {
    label: "Practice",
    items: [
      { label: "Mocks", icon: ClipboardCheck, to: "/mocks" },
      { label: "Review", icon: Repeat2 },
    ],
  },
  {
    label: "Progress",
    items: [
      { label: "Stats", icon: BarChart3 },
      { label: "Tracker", icon: Spline },
    ],
  },
];

export function DashboardSidebar({
  active,
  email,
}: {
  active: string;
  email?: string | undefined;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 md:flex"
      style={{ width: collapsed ? "5rem" : "16rem" }}
    >
      <div className={`flex items-center gap-2 px-4 py-5 ${collapsed ? "justify-center" : ""}`}>
        <img src={lantern} alt="" width={912} height={1200} className="h-8 w-auto shrink-0" />
        {!collapsed ? (
          <span className="font-display truncate text-xl font-semibold text-primary">
            LanternSAT
          </span>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {groups.map((group, gi) => (
          <div key={group.label ?? gi} className="mb-2">
            {group.label && !collapsed ? (
              <p className="mt-4 mb-1 px-3 text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {group.label}
              </p>
            ) : null}
            {group.label && collapsed ? <div className="my-3 h-px bg-border" /> : null}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = active === item.label;
                const cls = `flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-accent text-primary"
                    : "text-foreground/75 hover:bg-accent hover:text-foreground"
                } ${collapsed ? "justify-center" : ""}`;
                const inner = (
                  <>
                    <Icon size={19} className="shrink-0" />
                    {!collapsed ? <span className="truncate">{item.label}</span> : null}
                  </>
                );
                return (
                  <li key={item.label}>
                    {item.to ? (
                      <Link to={item.to} title={collapsed ? item.label : undefined} className={cls}>
                        {inner}
                      </Link>
                    ) : (
                      <Link
                        to="/dashboard"
                        search={{ section: item.label }}
                        title={collapsed ? item.label : undefined}
                        className={cls}
                      >
                        {inner}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border px-3 py-3">
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground ${
            collapsed ? "justify-center" : ""
          }`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
          {!collapsed ? <span>Collapse</span> : null}
        </button>

        {!collapsed ? (
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-3 block rounded-2xl bg-telegram p-3 text-primary-foreground"
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <Send size={16} /> Join our Telegram!
            </span>
            <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs opacity-90">
              <li>Free weekly study sessions</li>
              <li>Free mock exam drops</li>
            </ul>
          </a>
        ) : null}

        {email ? (
          <div className={`mt-3 flex items-center gap-2 px-1 ${collapsed ? "justify-center" : ""}`}>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground uppercase">
              {email.charAt(0)}
            </span>
            {!collapsed ? (
              <span className="min-w-0 truncate text-sm text-foreground/80">
                {email.split("@")[0]}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
