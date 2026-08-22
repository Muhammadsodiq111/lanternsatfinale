import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

import { useIsAdmin } from "@/lib/admin";

/**
 * Renders content-management screens only for accounts with the admin role.
 * Students see a friendly notice instead of a wall of RLS errors.
 */
export function AdminOnly({ children }: { children: ReactNode }) {
  const { isAdmin, loading } = useIsAdmin();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-cream">
        <p className="text-sm text-foreground/60">Checking permissions…</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-cream px-4">
        <div className="max-w-md rounded-2xl border border-border bg-background p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground">Admins only</h1>
          <p className="mt-2 text-sm text-foreground/70">
            This page manages shared LanternSAT content. Your account doesn't have the admin role.
          </p>
          <Link
            to="/dashboard"
            search={{ section: "Home" }}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
