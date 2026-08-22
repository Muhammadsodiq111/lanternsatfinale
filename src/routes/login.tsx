import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import {
  AuthShell,
  Divider,
  Field,
  GoogleButton,
  LegalNote,
  Message,
  PasswordField,
  SubmitButton,
} from "@/components/auth/auth-shell";
import { markPostAuthRedirect } from "@/lib/post-auth-redirect";
import { supabase } from "@/integrations/supabase/external";
import { ensureSession } from "@/lib/auth-session";

export const Route = createFileRoute("/login")({
  ssr: false,
  beforeLoad: async () => {
    const session = await ensureSession();
    if (session) throw redirect({ to: "/dashboard", search: { section: "Home" }, replace: true });
  },
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Log in — LanternSAT" },
      { name: "description", content: "Log in to your LanternSAT account to keep prepping for the Digital SAT." },
      { property: "og:title", content: "Log in — LanternSAT" },
      { property: "og:description", content: "Log in to your LanternSAT account to keep prepping for the Digital SAT." },
    ],
  }),
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setPending(false);
      setError(error.message);
      return;
    }
    navigate({ to: "/dashboard", search: { section: "Home" }, replace: true });
  }

  async function onGoogle() {
    setGooglePending(true);
    setError(null);
    markPostAuthRedirect("/dashboard");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setGooglePending(false);
      setError(error.message ?? "Google sign-in failed. Please try again.");
      return;
    }
  }

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Sign in to continue your SAT prep journey"
      footer={<LegalNote action="signing in" />}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          action={
            <Link to="/forgot-password" className="text-sm text-primary hover:underline">
              Forgot password?
            </Link>
          }
        />
        {error ? <Message tone="error" text={error} /> : null}
        <SubmitButton pending={pending}>Sign In</SubmitButton>
      </form>

      <Divider text="or continue with" />
      <GoogleButton onClick={onGoogle} pending={googlePending} label="Continue with Google" />

      <p className="mt-6 text-center text-sm text-foreground/80">
        Don't have an account?{" "}
        <Link to="/signup" className="font-semibold text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </AuthShell>
  );
}
