import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Bookmark, ChevronLeft, ChevronRight, Filter, LayoutList, Square, X } from "lucide-react";
import { useMemo, useState } from "react";

import {
  CATEGORIES,
  DIFFICULTY_STYLES,
  saveProgress,
  vocabProgressQuery,
  vocabWordsQuery,
  type Difficulty,
  type VocabCategory,
  type VocabWord,
} from "@/lib/vocab";

type Search = {
  category: VocabCategory;
  mode: "cards" | "scroll";
  start?: string;
  limit?: number;
};

export const Route = createFileRoute("/_authenticated/vocab/study")({
  validateSearch: (search: Record<string, unknown>): Search => {
    const category = CATEGORIES.some((c) => c.value === search['category'])
      ? (search['category'] as VocabCategory)
      : "vocabulary";
    const mode = search['mode'] === "scroll" ? "scroll" : "cards";
    const start = typeof search['start'] === "string" ? search['start'] : undefined;
    const limitRaw = Number(search['limit']);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined;
    return { category, mode, ...(start ? { start } : {}), ...(limit ? { limit } : {}) };
  },
  component: StudyPage,
  head: () => ({
    meta: [
      { title: "Vocab study — LanternSAT" },
      { name: "description", content: "Flashcard and scroll review for SAT vocabulary words." },
      { property: "og:title", content: "Vocab study — LanternSAT" },
      { property: "og:description", content: "Flashcard and scroll review for SAT vocabulary words." },
    ],
  }),
});

function StudyPage() {
  const { user } = Route.useRouteContext();
  const { category, mode, start, limit } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: words = [], isLoading } = useQuery(vocabWordsQuery(category));
  const { data: progress = {} } = useQuery(vocabProgressQuery());

  const [level, setLevel] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const list = useMemo(() => {
    let items = words;
    if (level !== "all") items = items.filter((w) => w.difficulty === level);
    if (limit) {
      // Skip words already marked as known, then pick a random batch so users
      // keep meeting new words instead of always the first ones in the list.
      const unknown = items.filter((w) => !progress[w.id]?.known);
      const pool = unknown.length > 0 ? unknown : items;
      const shuffled = [...pool];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const a = shuffled[i]!;
        shuffled[i] = shuffled[j]!;
        shuffled[j] = a;
      }
      items = shuffled.slice(0, limit);
    }
    return items;
    // progress intentionally omitted: re-shuffling on every "known" toggle
    // would reshuffle the batch mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, level, limit]);

  const startIndex = useMemo(() => {
    if (!start) return 0;
    const i = list.findIndex((w) => w.id === start);
    return i >= 0 ? i : 0;
  }, [list, start]);

  const [offsetApplied, setOffsetApplied] = useState(false);
  if (!offsetApplied && list.length > 0) {
    setOffsetApplied(true);
    setIndex(startIndex);
  }

  async function update(wordId: string, patch: Parameters<typeof saveProgress>[2]) {
    if (!user?.id) return;
    await saveProgress(user.id, wordId, patch);
    await queryClient.invalidateQueries({ queryKey: ["vocab-progress"] });
  }

  function setMode(next: "cards" | "scroll") {
    void navigate({
      to: "/vocab/study",
      search: { category, mode: next, ...(start ? { start } : {}), ...(limit ? { limit } : {}) },
      replace: true,
    });
  }

  const currentWord = list[Math.min(index, Math.max(0, list.length - 1))];

  return (
    <div className="min-h-screen bg-sky">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-5">
        <div className="flex gap-2">
          <ModeButton active={mode === "cards"} onClick={() => setMode("cards")} icon={<Square size={15} />} label="Cards" />
          <ModeButton active={mode === "scroll"} onClick={() => setMode("scroll")} icon={<LayoutList size={15} />} label="Scroll" />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground"
          >
            <Filter size={15} /> Filters
          </button>
          <Link
            to="/vocab"
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            <X size={15} /> Exit
          </Link>
        </div>
      </div>

      {showFilters ? (
        <div className="mx-auto mb-4 flex max-w-3xl flex-wrap gap-2 rounded-2xl border border-border bg-card px-4 py-3">
          {["all", "easy", "medium", "hard", "challenge"].map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => {
                setLevel(l);
                setIndex(0);
                setRevealed(false);
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${
                level === l ? "bg-primary text-primary-foreground" : "border border-border text-foreground"
              }`}
            >
              {l === "all" ? "All levels" : l}
            </button>
          ))}
        </div>
      ) : null}

      {isLoading ? (
        <p className="py-24 text-center text-sm text-muted-foreground">Loading words…</p>
      ) : list.length === 0 ? (
        <p className="py-24 text-center text-sm text-muted-foreground">No words match these filters.</p>
      ) : mode === "cards" ? (
        currentWord ? (
          <div className="mx-auto flex max-w-3xl items-center gap-4 px-5 pb-16">
            <NavArrow
              dir="prev"
              disabled={index === 0}
              onClick={() => {
                setIndex((i) => Math.max(0, i - 1));
                setRevealed(false);
              }}
            />
            <div className="min-w-0 flex-1">
              <FlashCard
                word={currentWord}
                position={`Word ${index + 1} of ${list.length}`}
                revealed={revealed}
                onReveal={() => setRevealed((v) => !v)}
                flagged={Boolean(progress[currentWord.id]?.flagged)}
                known={Boolean(progress[currentWord.id]?.known)}
                sentence={progress[currentWord.id]?.own_sentence ?? ""}
                onUpdate={(patch) => void update(currentWord.id, patch)}
              />
            </div>
            <NavArrow
              dir="next"
              disabled={index >= list.length - 1}
              onClick={() => {
                setIndex((i) => Math.min(list.length - 1, i + 1));
                setRevealed(false);
              }}
            />
          </div>
        ) : null
      ) : (
        <div className="mx-auto max-w-3xl px-5 pb-20">
          <p className="mb-3 text-sm font-semibold text-muted-foreground">
            {list.length} of {words.length} words
          </p>
          <div className="space-y-4">
            {list.map((w, i) => (
              <ScrollRow
                key={w.id}
                word={w}
                rank={i + 1}
                flagged={Boolean(progress[w.id]?.flagged)}
                known={Boolean(progress[w.id]?.known)}
                sentence={progress[w.id]?.own_sentence ?? ""}
                onUpdate={(patch) => void update(w.id, patch)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type Patch = Parameters<typeof saveProgress>[2];

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
        active ? "bg-primary text-primary-foreground" : "border border-border bg-card text-foreground"
      }`}
    >
      {icon} {label}
    </button>
  );
}

function NavArrow({ dir, disabled, onClick }: { dir: "prev" | "next"; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={dir === "prev" ? "Previous word" : "Next word"}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-card text-primary shadow-[0_10px_30px_-12px_rgba(20,40,90,0.4)] disabled:text-muted-foreground disabled:opacity-50"
    >
      {dir === "prev" ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
    </button>
  );
}

function Tags({ word }: { word: VocabWord }) {
  const style = DIFFICULTY_STYLES[word.difficulty as Difficulty] ?? "bg-muted text-muted-foreground";
  return (
    <>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${style}`}>{word.difficulty}</span>
      <span className="rounded-full bg-violet/10 px-2.5 py-1 text-xs font-semibold text-violet">
        {word.part_of_speech}
      </span>
    </>
  );
}

function SentenceBox({
  sentence,
  known,
  onUpdate,
}: {
  sentence: string;
  known: boolean;
  onUpdate: (patch: Patch) => void;
}) {
  const [value, setValue] = useState(sentence);
  return (
    <div className="border-t border-border p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onUpdate({ own_sentence: value })}
          className="rounded-lg bg-violet/10 px-3 py-1.5 text-xs font-semibold text-violet"
        >
          Save my sentence
        </button>
        <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground">
          <input
            type="checkbox"
            checked={known}
            onChange={(e) => onUpdate({ known: e.target.checked })}
            className="h-4 w-4 accent-[var(--primary)]"
          />
          I know this word
        </label>
      </div>
      <div className="relative mt-3">
        <textarea
          value={value}
          maxLength={250}
          onChange={(e) => setValue(e.target.value)}
          onBlur={() => (value !== sentence ? onUpdate({ own_sentence: value }) : undefined)}
          placeholder="Write your own example sentence…"
          className="min-h-24 w-full resize-y rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
        />
        <span className="absolute right-3 bottom-2 text-xs text-muted-foreground">{value.length}/250</span>
      </div>
    </div>
  );
}

function FlagButton({ flagged, onUpdate }: { flagged: boolean; onUpdate: (patch: Patch) => void }) {
  return (
    <button
      type="button"
      onClick={() => onUpdate({ flagged: !flagged })}
      aria-label={flagged ? "Remove bookmark" : "Bookmark word"}
      className={flagged ? "text-amber" : "text-amber/40 hover:text-amber"}
    >
      <Bookmark size={22} fill={flagged ? "currentColor" : "none"} />
    </button>
  );
}

function FlashCard({
  word,
  position,
  revealed,
  onReveal,
  flagged,
  known,
  sentence,
  onUpdate,
}: {
  word: VocabWord;
  position: string;
  revealed: boolean;
  onReveal: () => void;
  flagged: boolean;
  known: boolean;
  sentence: string;
  onUpdate: (patch: Patch) => void;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_30px_80px_-50px_rgba(20,40,90,0.5)]">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex gap-2">
          <Tags word={word} />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-muted-foreground">{position}</span>
          <FlagButton flagged={flagged} onUpdate={onUpdate} />
        </div>
      </div>

      <button
        type="button"
        onClick={onReveal}
        className="flex min-h-72 w-full flex-col items-center justify-center gap-3 px-8 py-10 text-center"
      >
        <h2 className="font-display text-4xl font-semibold text-foreground">{word.word}</h2>
        {revealed ? (
          <div className="max-w-lg space-y-3">
            <p className="text-base text-foreground">{word.definition}</p>
            {word.example_sentence ? (
              <p className="rounded-xl border-l-4 border-primary bg-accent p-3 text-left text-sm text-foreground/80 italic">
                “{word.example_sentence}”
              </p>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Click to reveal meaning</p>
        )}
      </button>

      <SentenceBox sentence={sentence} known={known} onUpdate={onUpdate} />
    </article>
  );
}

function ScrollRow({
  word,
  rank,
  flagged,
  known,
  sentence,
  onUpdate,
}: {
  word: VocabWord;
  rank: number;
  flagged: boolean;
  known: boolean;
  sentence: string;
  onUpdate: (patch: Patch) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_20px_60px_-50px_rgba(20,40,90,0.45)]">
      <div className="flex items-center justify-between gap-3 px-5 py-4">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">#{rank}</span>
          <Tags word={word} />
          {!open ? <span className="font-display truncate text-xl font-semibold text-foreground">{word.word}</span> : null}
        </button>
        <FlagButton flagged={flagged} onUpdate={onUpdate} />
      </div>

      {open ? (
        <>
          <div className="border-t border-border px-5 py-5">
            <h3 className="font-display text-2xl font-semibold text-foreground">{word.word}</h3>
            <p className="mt-3 text-[11px] font-bold tracking-[0.14em] text-primary uppercase">Definition</p>
            <p className="mt-1 text-sm text-foreground">{word.definition}</p>
            {word.example_sentence ? (
              <p className="mt-3 rounded-xl border-l-4 border-primary bg-accent p-3 text-sm text-foreground/80">
                “{word.example_sentence}”
              </p>
            ) : null}
          </div>
          <SentenceBox sentence={sentence} known={known} onUpdate={onUpdate} />
        </>
      ) : null}
    </article>
  );
}
