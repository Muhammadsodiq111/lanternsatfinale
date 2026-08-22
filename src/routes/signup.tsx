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

export const Route = createFileRoute("/signup")({
  ssr: false,
  beforeLoad: async () => {
    const session = await ensureSession();
    if (session) throw redirect({ to: "/dashboard", search: { section: "Home" }, replace: true });
  },
  component: SignupPage,
  head: () => ({
    meta: [
      { title: "Sign up free — LanternSAT" },
      { name: "description", content: "Create your free LanternSAT account and start Digital SAT prep in minutes." },
      { property: "og:title", content: "Sign up free — LanternSAT" },
      { property: "og:description", content: "Create your free LanternSAT account and start Digital SAT prep in minutes." },
    ],
  }),
});

function SignupPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const passwordLongEnough = password.length >= 6;
  const matches = confirm.length > 0 && confirm === password;
  const canSubmit = email.length > 3 && passwordLongEnough && matches;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      setPending(false);
      setError(error.message);
      return;
    }
    if (data.session) {
      navigate({ to: "/dashboard", search: { section: "Home" }, replace: true });
      return;
    }
    setPending(false);
    setNotice("Check your inbox — confirm your email to finish creating your account.");
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
      setError(error.message ?? "Google sign-up failed. Please try again.");
      return;
    }
  }

  return (
    <AuthShell
      tagline="Create your account"
      title="Get Started"
      subtitle="Join thousands of students acing the SAT"
      footer={<LegalNote action="creating an account" />}
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
          placeholder="Enter your email"
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Create a password"
          hint={passwordLongEnough ? "✓ At least 6 characters" : "At least 6 characters"}
        />
        <PasswordField
          id="confirm"
          label="Confirm Password"
          autoComplete="new-password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Confirm your password"
          hint={confirm.length > 0 && !matches ? "Passwords do not match" : ""}
        />
        {error ? <Message tone="error" text={error} /> : null}
        {notice ? <Message tone="success" text={notice} /> : null}
        <SubmitButton pending={pending} disabled={!canSubmit}>
          Create Account
        </SubmitButton>
      </form>

      <Divider text="or continue with" />
      <GoogleButton onClick={onGoogle} pending={googlePending} label="Continue with Google" />

      <p className="mt-6 text-center text-sm text-foreground/80">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </AuthShell>
  );
}
