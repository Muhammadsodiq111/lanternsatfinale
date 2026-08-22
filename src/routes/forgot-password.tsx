import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { AuthShell, Field, Message, SubmitButton } from "@/components/auth/auth-shell";
import { supabase } from "@/integrations/supabase/external";

export const Route = createFileRoute("/forgot-password")({
  ssr: false,
  component: ForgotPasswordPage,
  head: () => ({
    meta: [
      { title: "Reset your password — LanternSAT" },
      { name: "description", content: "Send yourself a secure link to reset your LanternSAT password." },
      { property: "og:title", content: "Reset your password — LanternSAT" },
      { property: "og:description", content: "Send yourself a secure link to reset your LanternSAT password." },
    ],
  }),
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }

  return (
    <AuthShell
      title="Forgot password"
      subtitle="We'll email you a link to set a new one."
      footer={
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Back to log in
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@school.edu"
        />
        {error ? <Message tone="error" text={error} /> : null}
        {sent ? <Message tone="success" text="Link sent. Check your inbox (and spam)." /> : null}
        <SubmitButton pending={pending}>Send reset link</SubmitButton>
      </form>
    </AuthShell>
  );
}
