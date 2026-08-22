import { Link } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";

import lantern from "@/assets/lantern.png";

export function AuthShell({
  tagline,
  title,
  subtitle,
  children,
  footer,
}: {
  tagline?: string;
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-sky px-5 py-14">
      <Link to="/" className="flex items-center gap-2">
        <img
          src={lantern}
          alt="LanternSAT lantern mascot"
          width={912}
          height={1200}
          className="h-10 w-auto"
        />
        <span className="font-display text-4xl font-semibold text-primary">LanternSAT</span>
      </Link>
      {tagline ? <p className="mt-2 text-sm text-muted-foreground">{tagline}</p> : null}

      <div className="mt-8 w-full max-w-md rounded-2xl bg-card p-8 shadow-[0_18px_50px_-30px_rgba(20,40,90,0.4)]">
        <h1 className="text-center text-2xl font-bold text-foreground">{title}</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">{subtitle}</p>
        <div className="mt-7">{children}</div>
      </div>

      {footer ? <div className="mt-6 text-center text-sm">{footer}</div> : null}
    </main>
  );
}

export function Field({
  label,
  hint,
  action,
  ...props
}: { label: string; hint?: string; action?: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={props.id} className="text-sm font-medium text-foreground/90">
          {label}
        </label>
        {action}
      </div>
      <input
        {...props}
        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function PasswordField({
  label,
  hint,
  action,
  ...props
}: { label: string; hint?: string; action?: ReactNode } & React.InputHTMLAttributes<HTMLInputElement>) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label htmlFor={props.id} className="text-sm font-medium text-foreground/90">
          {label}
        </label>
        {action}
      </div>
      <div className="relative">
        <input
          {...props}
          type={show ? "text" : "password"}
          className="w-full rounded-xl border border-input bg-background px-4 py-3 pr-11 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint ? <p className="mt-1.5 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function SubmitButton({
  pending,
  disabled,
  children,
}: {
  pending: boolean;
  disabled?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? <Loader2 size={16} className="animate-spin" /> : null}
      {children}
    </button>
  );
}

export function Divider({ text }: { text: string }) {
  return (
    <div className="my-5 flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">{text}</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function GoogleButton({
  onClick,
  pending,
  label,
}: {
  onClick: () => void;
  pending: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.5 2.5 30.1 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.2 17.7 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.1 24.5c0-1.6-.1-3.2-.4-4.7H24v9h12.4c-.5 2.9-2.1 5.4-4.5 7l7.1 5.5c4.2-3.9 6.6-9.6 6.6-16.8z"
          />
          <path
            fill="#FBBC05"
            d="M10.4 28.7c-.5-1.5-.8-3-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C1 16.4 0 20.1 0 24s1 7.6 2.6 10.8l7.8-6.1z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.4-4.6 2.2-8.8 2.2-6.3 0-11.7-3.7-13.6-9.2l-7.8 6.1C6.5 42.6 14.6 48 24 48z"
          />
        </svg>
      )}
      {label}
    </button>
  );
}

export function Message({ tone, text }: { tone: "error" | "success"; text: string }) {
  return (
    <p
      role="status"
      className={`rounded-xl px-4 py-3 text-sm ${
        tone === "error" ? "bg-destructive/10 text-destructive" : "bg-emerald/10 text-foreground"
      }`}
    >
      {text}
    </p>
  );
}

export function LegalNote({ action }: { action: string }) {
  return (
    <p className="text-center text-xs text-muted-foreground">
      By {action}, you agree to our{" "}
      <a href="#" className="text-primary hover:underline">
        Terms of Service
      </a>{" "}
      and{" "}
      <a href="#" className="text-primary hover:underline">
        Privacy Policy
      </a>
      .
    </p>
  );
}
