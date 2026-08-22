import { Component, Suspense, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";

import { questionBankQuery } from "@/lib/practice";

/** Card-shaped shimmer placeholder used while the question bank loads. */
export function SectionSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="space-y-5" aria-busy="true" aria-live="polite">
      <div className="grid gap-5 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-28 animate-pulse rounded-3xl border border-border bg-card shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]"
          />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-48 animate-pulse rounded-3xl border border-border bg-card shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]"
        />
      ))}
    </div>
  );
}

function RetryCard({ onRetry }: { onRetry: () => void }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center shadow-[0_20px_60px_-45px_rgba(20,40,90,0.45)]">
      <h2 className="font-display text-xl font-semibold text-foreground">
        Couldn&apos;t load your question bank
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        The connection hiccuped while fetching your questions. Give it another try.
      </p>
      <button
        type="button"
        onClick={() => {
          queryClient.resetQueries({ queryKey: questionBankQuery.queryKey });
          router.invalidate();
          onRetry();
        }}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
      >
        <RotateCcw size={15} /> Retry
      </button>
    </div>
  );
}

class Catch extends Component<{ children: ReactNode }, { error: Error | null }> {
  override state: { error: Error | null } = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override render() {
    if (this.state.error) {
      return <RetryCard onRetry={() => this.setState({ error: null })} />;
    }
    return this.props.children;
  }
}

/** Suspense + error boundary wrapper for dashboard sections that read the bank. */
export function BankBoundary({ children, rows }: { children: ReactNode; rows?: number }) {
  return (
    <Catch>
      <Suspense fallback={<SectionSkeleton {...(rows !== undefined ? { rows } : {})} />}>
        {children}
      </Suspense>
    </Catch>
  );
}
