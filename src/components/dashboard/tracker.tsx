import { Fragment, useMemo, useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Check, ExternalLink, NotebookPen, RotateCcw, Star, X } from "lucide-react";
import { DIFFICULTY_LEVELS, questionBankQuery, type BankRow, type Level } from "@/lib/practice";
import { MODULE_CATALOG } from "@/lib/module-catalog";
import { usePersistentState } from "@/lib/local-store";

type Bucket = { label: string; level: Level; ids: string[] };
type Topic = { title: string; total: number; buckets: Bucket[] };
type Domain = { title: string; topics: Topic[] };

const LEVEL_LABEL: Record<Level, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  challenge: "Challenge",
};

type Status = "unattempted" | "correct" | "incorrect";

function buildDomains(rows: BankRow[]): Domain[] {
  const byModule = new Map<string, BankRow[]>();
  for (const row of rows) {
    const list = byModule.get(row.module);
    if (list) list.push(row);
    else byModule.set(row.module, [row]);
  }

  const domains: Domain[] = [];
  const seenModules = new Set<string>();

  for (const subject of ["math", "english"] as const) {
    for (const topic of MODULE_CATALOG[subject]) {
      const topics: Topic[] = [];
      for (const mod of topic.modules) {
        const moduleRows = byModule.get(mod.title) ?? [];
        if (!moduleRows.length) continue;
        seenModules.add(mod.title);
        topics.push(toTopic(mod.title, moduleRows));
      }
      if (topics.length) domains.push({ title: topic.title, topics });
    }
  }

  const extras = Array.from(byModule.entries()).filter(([title]) => !seenModules.has(title));
  if (extras.length) {
    domains.push({
      title: "Other Modules",
      topics: extras.map(([title, moduleRows]) => toTopic(title, moduleRows)),
    });
  }

  return domains;
}

function toTopic(title: string, moduleRows: BankRow[]): Topic {
  const buckets = DIFFICULTY_LEVELS.map((level) => ({
    label: LEVEL_LABEL[level],
    level,
    ids: moduleRows.filter((r) => r.level === level).map((r) => r.id),
  })).filter((b) => b.ids.length > 0);
  return { title, total: moduleRows.length, buckets };
}

const TONE: Record<Level, string> = {
  easy: "text-emerald",
  medium: "text-amber",
  hard: "text-flame",
  challenge: "text-violet",
};

export function TrackerSection() {
  const { data: rows } = useSuspenseQuery(questionBankQuery);
  const [openTopic, setOpenTopic] = useState<string | null>(null);
  const [openBucket, setOpenBucket] = useState<string | null>(null);
  const [status, setStatus] = usePersistentState<Record<string, Status>>("tracker-status", {});
  const [starred, setStarred] = usePersistentState<Record<string, boolean>>("tracker-starred", {});
  const [notes, setNotes] = usePersistentState<Record<string, string>>("tracker-notes", {});
  const [openNote, setOpenNote] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const domains = useMemo(() => buildDomains(rows), [rows]);

  const totals = useMemo(() => {
    const values = Object.values(status);
    return {
      correct: values.filter((v) => v === "correct").length,
      incorrect: values.filter((v) => v === "incorrect").length,
      attempted: values.filter((v) => v !== "unattempted").length,
    };
  }, [status]);

  const grandTotal = rows.length;
  const pct = grandTotal ? Math.round((totals.attempted / grandTotal) * 100) : 0;

  function cycle(id: string) {
    setStatus((prev) => {
      const current = prev[id] ?? "unattempted";
      const next: Status =
        current === "unattempted" ? "correct" : current === "correct" ? "incorrect" : "unattempted";
      return { ...prev, [id]: next };
    });
  }

  const attemptedIds = (ids: string[]) =>
    ids.filter((id) => (status[id] ?? "unattempted") !== "unattempted").length;

  function attemptedIn(topic: Topic) {
    return topic.buckets.reduce((sum, b) => sum + attemptedIds(b.ids), 0);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
      <section className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
          <h3 className="font-display text-base font-semibold text-foreground">
            Questionbank Tracker
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setStatus({});
                setStarred({});
                setNotes({});
                setOpenNote(null);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              <RotateCcw size={13} /> Reset
            </button>
            <a
              href="https://satsuitequestionbank.collegeboard.org/digital/search"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground"
            >
              Open CB <ExternalLink size={13} />
            </a>
          </div>
        </div>

        <div className="space-y-4 p-4">
          {domains.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              No questions in the bank yet — add questions in Practice → Manage and they appear here
              automatically.
            </p>
          ) : null}

          {domains.map((domain) => {
            const domainTotal = domain.topics.reduce((s, t) => s + t.total, 0);
            const domainDone = domain.topics.reduce((s, t) => s + attemptedIn(t), 0);
            return (
              <div key={domain.title} className="overflow-hidden rounded-2xl border border-border">
                <div className="flex items-center justify-between bg-muted/60 px-4 py-3">
                  <span className="font-display text-sm font-semibold text-foreground">
                    {domain.title}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground">
                    {domainDone} / {domainTotal}
                  </span>
                </div>

                {domain.topics.map((topic) => {
                  const isOpen = openTopic === topic.title;
                  const done = attemptedIn(topic);
                  return (
                    <div key={topic.title} className="border-t border-border">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenTopic(isOpen ? null : topic.title);
                          setOpenBucket(null);
                        }}
                        className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-accent ${
                          isOpen ? "bg-accent" : ""
                        }`}
                      >
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                          {topic.title}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground">
                          {done} / {topic.total}
                        </span>
                        <span className="hidden h-1.5 w-40 overflow-hidden rounded-full bg-muted sm:block">
                          <span
                            className="block h-full rounded-full bg-emerald"
                            style={{ width: `${topic.total ? (done / topic.total) * 100 : 0}%` }}
                          />
                        </span>
                      </button>

                      {isOpen
                        ? topic.buckets.map((b) => {
                            const key = `${topic.title}|${b.label}`;
                            const bucketOpen = openBucket === key;
                            const bucketDone = attemptedIds(b.ids);
                            return (
                              <div key={key} className="border-t border-border">
                                <button
                                  type="button"
                                  onClick={() => setOpenBucket(bucketOpen ? null : key)}
                                  className="flex w-full items-center justify-between px-6 py-2.5 text-left hover:bg-accent"
                                >
                                  <span className={`text-sm font-bold ${TONE[b.level]}`}>
                                    {b.label}
                                  </span>
                                  <span className="text-xs font-bold text-muted-foreground">
                                    {bucketDone} / {b.ids.length}
                                  </span>
                                </button>

                                {bucketOpen ? (
                                  <div className="max-h-96 overflow-y-auto px-6 pb-3">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                                          <th className="py-2 text-left font-bold">ID #</th>
                                          <th className="py-2 font-bold">Star</th>
                                          <th className="py-2 font-bold">Status</th>
                                          <th className="py-2 font-bold">Notes</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {b.ids.map((id) => {
                                          const shortId = id.slice(0, 7);
                                          if (query && !shortId.includes(query.toLowerCase()))
                                            return null;
                                          const st = status[id] ?? "unattempted";
                                           return (
                                             <Fragment key={id}>
                                             <tr className="border-t border-border">
                                              <td className="py-2 font-mono text-xs text-foreground">
                                                {shortId}
                                              </td>
                                              <td className="py-2 text-center">
                                                <button
                                                  type="button"
                                                  aria-label="Star question"
                                                  onClick={() =>
                                                    setStarred((p) => ({ ...p, [id]: !p[id] }))
                                                  }
                                                >
                                                  <Star
                                                    size={16}
                                                    className={
                                                      starred[id]
                                                        ? "fill-amber text-amber"
                                                        : "text-muted-foreground"
                                                    }
                                                  />
                                                </button>
                                              </td>
                                              <td className="py-2 text-center">
                                                <button
                                                  type="button"
                                                  aria-label="Toggle status"
                                                  onClick={() => cycle(id)}
                                                  className={`grid size-6 place-items-center rounded-md border ${
                                                    st === "correct"
                                                      ? "border-emerald text-emerald"
                                                      : st === "incorrect"
                                                        ? "border-flame text-flame"
                                                        : "border-border text-transparent"
                                                  }`}
                                                >
                                                  {st === "incorrect" ? (
                                                    <X size={13} />
                                                  ) : (
                                                    <Check size={13} />
                                                  )}
                                                </button>
                                              </td>
                                               <td className="py-2 text-center">
                                                 <button
                                                   type="button"
                                                   aria-label="Toggle note"
                                                   aria-expanded={openNote === id}
                                                   onClick={() =>
                                                     setOpenNote(openNote === id ? null : id)
                                                   }
                                                 >
                                                   <NotebookPen
                                                     size={16}
                                                     className={`mx-auto ${
                                                       notes[id]?.trim()
                                                         ? "text-primary"
                                                         : "text-muted-foreground"
                                                     }`}
                                                   />
                                                 </button>
                                               </td>
                                             </tr>
                                             {openNote === id ? (
                                               <tr className="border-t border-border">
                                                 <td colSpan={4} className="px-1 py-3">
                                                   <textarea
                                                     value={notes[id] ?? ""}
                                                     onChange={(e) =>
                                                       setNotes((p) => ({
                                                         ...p,
                                                         [id]: e.target.value,
                                                       }))
                                                     }
                                                     placeholder="Write a note for this question…"
                                                     rows={3}
                                                     className="w-full resize-y rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                                                   />
                                                   <div className="mt-2 flex justify-end gap-2">
                                                     <button
                                                       type="button"
                                                       onClick={() =>
                                                         setNotes((p) => ({ ...p, [id]: "" }))
                                                       }
                                                       className="rounded-lg border border-border px-2.5 py-1 text-xs font-bold text-muted-foreground hover:text-foreground"
                                                     >
                                                       Clear
                                                     </button>
                                                     <button
                                                       type="button"
                                                       onClick={() => setOpenNote(null)}
                                                       className="rounded-lg border border-border px-2.5 py-1 text-xs font-bold text-foreground hover:bg-accent"
                                                     >
                                                       Done
                                                     </button>
                                                   </div>
                                                 </td>
                                               </tr>
                                             ) : null}
                                             </Fragment>
                                           );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })
                        : null}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </section>

      <div className="space-y-5">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]">
          <h3 className="font-display text-base font-semibold text-foreground">Stats</h3>
          <p className="mt-4 text-center text-sm font-semibold text-muted-foreground">
            Overall Progress
          </p>
          <div className="relative mx-auto mt-3 grid size-32 place-items-center">
            <svg viewBox="0 0 130 130" className="size-32 -rotate-90">
              <circle cx="65" cy="65" r="52" fill="none" strokeWidth="14" className="stroke-muted" />
              <circle
                cx="65"
                cy="65"
                r="52"
                fill="none"
                strokeWidth="14"
                strokeLinecap="round"
                className="stroke-primary"
                strokeDasharray={`${(pct / 100) * 2 * Math.PI * 52} ${2 * Math.PI * 52}`}
              />
            </svg>
            <div className="absolute text-center">
              <p className="font-display text-xl font-semibold text-foreground">{pct}%</p>
              <p className="text-[11px] text-muted-foreground">attempted</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-center">
            <div>
              <p className="text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                Correct
              </p>
              <p className="font-display text-lg font-semibold text-emerald">{totals.correct}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
                Incorrect
              </p>
              <p className="font-display text-lg font-semibold text-flame">{totals.incorrect}</p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-5 shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]">
          <h3 className="font-display text-base font-semibold text-foreground">Search</h3>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter ID..."
            className="mt-3 w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Filters question IDs inside an opened difficulty list.
          </p>
        </section>
      </div>
    </div>
  );
}
