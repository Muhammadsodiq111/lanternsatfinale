import { Link, useNavigate } from "@tanstack/react-router";

import { useAuthSession } from "@/lib/auth-session";

/**
 * "Get Started" that lands signed-in users straight on the dashboard and
 * everyone else on sign up. Renders a plain link until the session resolves so
 * there is no flash of the wrong destination.
 */
export function GetStartedButton({ className }: { className?: string }) {
  const { session, loaded } = useAuthSession();
  const navigate = useNavigate();

  if (!loaded) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => navigate({ to: "/signup" })}
        aria-busy="true"
      >
        Get Started
      </button>
    );
  }

  return (
    <Link to={session ? "/dashboard" : "/signup"} className={className}>
      Get Started
    </Link>
  );
}
