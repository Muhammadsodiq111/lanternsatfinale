import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";

import { supabase } from "@/integrations/supabase/external";

type Snapshot = { session: Session | null; loaded: boolean };

let snapshot: Snapshot = { session: null, loaded: false };
let pending: Promise<Session | null> | null = null;
const listeners = new Set<() => void>();

function set(session: Session | null) {
  snapshot = { session, loaded: true };
  listeners.forEach((l) => l());
}

/**
 * Resolves the current session once and keeps a module-level cache so route
 * guards resolve instantly on later navigations (no flashes, no blank screens).
 */
export function ensureSession(): Promise<Session | null> {
  if (snapshot.loaded) return Promise.resolve(snapshot.session);
  if (!pending) {
    supabase.auth.onAuthStateChange((_event, session) => set(session));
    pending = supabase.auth.getSession().then(({ data }) => {
      set(data.session);
      return data.session;
    });
  }
  return pending;
}

function subscribe(listener: () => void) {
  ensureSession();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const serverSnapshot: Snapshot = { session: null, loaded: false };

export function useAuthSession(): Snapshot {
  return useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => serverSnapshot,
  );
}

export function clearSessionCache() {
  set(null);
}
