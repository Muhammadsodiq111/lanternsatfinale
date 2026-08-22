/**
 * Google OAuth does a full-page redirect back to the site origin (the landing
 * page). We stash a flag before leaving so the landing page knows to forward
 * the user to the dashboard once the session is hydrated.
 */
const KEY = "lantern:post-auth-redirect";

export function markPostAuthRedirect(path = "/dashboard") {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    /* storage unavailable — fall back to staying on the landing page */
  }
}

export function takePostAuthRedirect(): string | null {
  try {
    const value = sessionStorage.getItem(KEY);
    if (value) sessionStorage.removeItem(KEY);
    return value && value.startsWith("/") ? value : null;
  } catch {
    return null;
  }
}
