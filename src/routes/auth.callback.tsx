import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuthSession } from "@/lib/auth-session";
import { takePostAuthRedirect } from "@/lib/post-auth-redirect";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  component: AuthCallback,
  head: () => ({
    meta: [
      { title: "Signing you in — LanternSAT" },
      { name: "description", content: "Completing your LanternSAT sign-in." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Signing you in — LanternSAT" },
      { property: "og:description", content: "Completing your LanternSAT sign-in." },
    ],
  }),
});

function AuthCallback() {
  const { session, loaded } = useAuthSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loaded) return;
    const target = takePostAuthRedirect() ?? "/dashboard";
    navigate({ to: session ? target : "/login", replace: true });
  }, [loaded, session, navigate]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-cream">
      <p className="text-muted-foreground">Signing you in…</p>
    </main>
  );
}
