"use client";

import { supabase } from "@/lib/supabase/client";

/**
 * Signs the user out and hard-navigates to the login page.
 *
 * Bulletproof by design:
 * 1. Races `auth.signOut()` against a short timeout so a slow or hung
 *    network call can never freeze the logout button.
 * 2. If the SDK could not reach the auth server, manually drops the
 *    `sb-*` session cookies so the proxy treats the next request as
 *    anonymous (instead of bouncing a logged-in user from /auth/login
 *    back to /dashboard).
 * 3. Uses a full page load (not client-side navigation) so the session
 *    is re-evaluated server-side from scratch.
 */
export async function logoutAndRedirect(redirectTo: string = "/auth/login") {
  try {
    await Promise.race([
      supabase.auth.signOut({ scope: "local" }),
      new Promise<void>((resolve) => setTimeout(resolve, 4000)),
    ]);
  } catch (err) {
    console.error("Logout: signOut call failed — forcing local session clear.", err);
  }

  // Fallback: make sure the Supabase session cookies are gone even if the
  // auth server was unreachable or the call timed out.
  if (typeof document !== "undefined") {
    document.cookie.split(";").forEach((entry) => {
      const name = entry.split("=")[0].trim();
      if (name.startsWith("sb-")) {
        document.cookie = `${name}=; Max-Age=0; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      }
    });
  }

  window.location.assign(redirectTo);
}
