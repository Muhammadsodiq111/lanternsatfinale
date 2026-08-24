import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/external";

export type TrackerStatus = "unattempted" | "correct" | "incorrect";

export type TrackerEntry = {
  status: TrackerStatus;
  starred: boolean;
  note: string;
  reviewed: boolean;
};

export type TrackerMap = Record<string, TrackerEntry>;

export const EMPTY_ENTRY: TrackerEntry = {
  status: "unattempted",
  starred: false,
  note: "",
  reviewed: false,
};

async function currentUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export const trackerProgressQuery = {
  queryKey: ["tracker-progress"],
  queryFn: async (): Promise<TrackerMap> => {
    const userId = await currentUserId();
    if (!userId) return {};
    const { data, error } = await supabase
      .from("tracker_progress")
      .select("question_id, status, starred, note, reviewed")
      .eq("user_id", userId);
    if (error) throw error;

    const map: TrackerMap = {};
    for (const row of data ?? []) {
      map[row.question_id] = {
        status:
          row.status === "correct" || row.status === "incorrect"
            ? (row.status as TrackerStatus)
            : "unattempted",
        starred: Boolean(row.starred),
        note: row.note ?? "",
        reviewed: Boolean(row.reviewed),
      };
    }
    return map;
  },
  staleTime: 30_000,
};

async function saveEntry(questionId: string, entry: TrackerEntry): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const { error } = await supabase.from("tracker_progress").upsert(
    {
      user_id: userId,
      question_id: questionId,
      status: entry.status,
      starred: entry.starred,
      note: entry.note,
      reviewed: entry.reviewed,
    },
    { onConflict: "user_id,question_id" },
  );
  if (error) throw error;
}

async function clearAll(): Promise<void> {
  const userId = await currentUserId();
  if (!userId) return;
  const { error } = await supabase.from("tracker_progress").delete().eq("user_id", userId);
  if (error) throw error;
}

/**
 * Tracker state backed by the `tracker_progress` table. Updates apply locally
 * right away and are written through to the database (notes are debounced).
 */
export function useTrackerProgress() {
  const { data, isLoading, error } = useQuery(trackerProgressQuery);
  const [local, setLocal] = useState<TrackerMap>({});
  const hydrated = useRef(false);
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    if (!data || hydrated.current) return;
    hydrated.current = true;
    setLocal(data);
  }, [data]);

  useEffect(
    () => () => {
      Object.values(timers.current).forEach(clearTimeout);
    },
    [],
  );

  const entry = useCallback((id: string): TrackerEntry => local[id] ?? EMPTY_ENTRY, [local]);

  const apply = useCallback(
    (id: string, patch: Partial<TrackerEntry>, debounce = false) => {
      setLocal((prev) => {
        const next = { ...(prev[id] ?? EMPTY_ENTRY), ...patch };
        const map = { ...prev, [id]: next };

        const flush = () => {
          void saveEntry(id, next).catch(() => undefined);
        };
        const existing = timers.current[id];
        if (existing) clearTimeout(existing);
        if (debounce) timers.current[id] = setTimeout(flush, 600);
        else flush();

        return map;
      });
    },
    [],
  );

  const cycleStatus = useCallback(
    (id: string) => {
      const current = local[id]?.status ?? "unattempted";
      const next: TrackerStatus =
        current === "unattempted" ? "correct" : current === "correct" ? "incorrect" : "unattempted";
      apply(id, { status: next });
    },
    [apply, local],
  );

  const toggleStar = useCallback(
    (id: string) => apply(id, { starred: !(local[id]?.starred ?? false) }),
    [apply, local],
  );

  const setNote = useCallback((id: string, note: string) => apply(id, { note }, true), [apply]);

  const toggleReviewed = useCallback(
    (id: string) => apply(id, { reviewed: !(local[id]?.reviewed ?? false) }),
    [apply, local],
  );

  const reset = useCallback(() => {
    Object.values(timers.current).forEach(clearTimeout);
    timers.current = {};
    setLocal({});
    void clearAll().catch(() => undefined);
  }, []);

  return {
    entries: local,
    entry,
    cycleStatus,
    toggleStar,
    setNote,
    toggleReviewed,
    reset,
    isLoading,
    error,
  };
}
