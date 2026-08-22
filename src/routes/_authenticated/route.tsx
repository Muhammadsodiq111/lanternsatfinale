import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

import { ensureSession } from "@/lib/auth-session";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const session = await ensureSession();
    if (!session) throw redirect({ to: "/login", replace: true });
    return { user: session.user };
  },
  component: () => <Outlet />,
});
