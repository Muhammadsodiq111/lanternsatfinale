import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { AuthShell, Field, Message, SubmitButton } from "@/components/auth/auth-shell";
import { supabase } from "@/integrations/supabase/external";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Set a new password — LanternSAT" },
      { name: "description", content: "Choose a new password for your LanternSAT account." },
      { property: "og:title", content: "Set a new password — LanternSAT" },
      { property: "og:description", content: "Choose a new password for your LanternSAT account." },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    navigate({ to: "/dashboard", search: { section: "Home" }, replace: true });
  }

  return (
    <AuthShell
      title="New password"
      subtitle={
        ready
          ? "Pick something you'll remember this time."
          : "Open this page from the reset link we emailed you."
      }
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={6}
          disabled={!ready}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />
        {error ? <Message tone="error" text={error} /> : null}
        <SubmitButton pending={pending}>Update password</SubmitButton>
      </form>
    </AuthShell>
  );
}
