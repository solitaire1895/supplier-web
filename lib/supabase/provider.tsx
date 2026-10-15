"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "./client";
import { User } from "@supabase/supabase-js";
import { withEffectivePlan } from "@/lib/plans";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  active_plan: string;
  trial_ends_at: string | null;
  subscription_status: string;
  plan_expires_at: string | null;
}

interface UserContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  authLoading: boolean;
  refreshProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

/** Maximum number of times we will retry a missing profile row before
 *  giving up and creating one ourselves. */
const MAX_PROFILE_RETRIES = 4;
const RETRY_DELAY_MS = 800;
/** A single profile request never waits longer than this. */
const PROFILE_REQUEST_TIMEOUT_MS = 10_000;
/** Absolute cap on any loading state, whatever happens. */
const LOADING_SAFETY_MS = 12_000;

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  // Latest known values, readable from callbacks without re-subscribing.
  const userIdRef = useRef<string | null>(null);
  const hasProfileRef = useRef(false);
  /** Incremented per fetch; only the latest fetch may write state. */
  const fetchSeq = useRef(0);

  // ---------------------------------------------------------------------------
  // upsertFallbackProfile
  // Last-resort: create the profile row on the client side when the DB trigger
  // did not do so. Never overwrites an existing row.
  // ---------------------------------------------------------------------------
  const upsertFallbackProfile = useCallback(async (authUser: User, seq: number) => {
    const fallback: Partial<UserProfile> = {
      id: authUser.id,
      email: authUser.email ?? null,
      full_name:
        (authUser.user_metadata?.full_name as string) ??
        (authUser.user_metadata?.name as string) ??
        null,
      role: "user",
      active_plan: "free",
      subscription_status: "active",
      plan_expires_at: null,
    };

    const { data: created, error: upsertError } = await supabase
      .from("profiles")
      .upsert(fallback, { onConflict: "id", ignoreDuplicates: true })
      .select("*")
      .abortSignal(AbortSignal.timeout(PROFILE_REQUEST_TIMEOUT_MS))
      .maybeSingle();

    if (seq !== fetchSeq.current) return;

    if (upsertError) {
      console.error("UserProvider: Error upserting fallback profile:", {
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint,
        code: upsertError.code,
      });
    }
    // Surface something so the UI is never blank.
    setProfile(created ? withEffectivePlan(created) : (fallback as UserProfile));
    hasProfileRef.current = true;
  }, []);

  // ---------------------------------------------------------------------------
  // fetchProfile
  // Loads the profile row, retrying while a brand-new signup's row is being
  // created. Every request has a timeout and stale responses are dropped, so
  // this can never leave `loading` stuck or overwrite newer data.
  // ---------------------------------------------------------------------------
  const fetchProfile = useCallback(
    async (authUser: User) => {
      const seq = ++fetchSeq.current;

      try {
        for (let attempt = 0; attempt <= MAX_PROFILE_RETRIES; attempt++) {
          if (attempt > 0) await delay(RETRY_DELAY_MS * attempt);
          if (seq !== fetchSeq.current) return; // a newer fetch took over

          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", authUser.id)
            .abortSignal(AbortSignal.timeout(PROFILE_REQUEST_TIMEOUT_MS))
            .maybeSingle();

          if (seq !== fetchSeq.current) return;

          if (data) {
            setProfile(withEffectivePlan(data));
            hasProfileRef.current = true;
            return;
          }

          if (error) {
            // Keep whatever profile we already have on a transient error.
            console.error("UserProvider: Error fetching profile:", {
              message: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code,
            });
          }
          // No row yet (fresh signup) or a transient error: retry.
        }

        // Exhausted retries: create the row ourselves unless we already have one.
        if (!hasProfileRef.current) await upsertFallbackProfile(authUser, seq);
      } catch (err) {
        console.error("UserProvider: Unexpected error fetching profile:", err);
      } finally {
        if (seq === fetchSeq.current) setLoading(false);
      }
    },
    [upsertFallbackProfile]
  );

  /**
   * Re-reads the profile in the background. The current profile stays on
   * screen meanwhile, so pages never flip back to a full-page spinner.
   */
  const refreshProfile = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    const authUser = data.session?.user;
    if (!authUser) return;
    if (!hasProfileRef.current) setLoading(true);
    await fetchProfile(authUser);
  }, [fetchProfile]);

  // ---------------------------------------------------------------------------
  // Auth state
  //
  // IMPORTANT: the onAuthStateChange callback runs inside supabase-js's
  // exclusive auth lock. Awaiting any Supabase call in it (like a profile
  // query) deadlocks the client: every later query on the page hangs and the
  // page stays on its spinner. So the callback is synchronous and only
  // schedules work with setTimeout, as the supabase-js docs recommend.
  // INITIAL_SESSION covers the first load, so no separate getSession() call.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let mounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      const authUser = session?.user ?? null;

      if (!authUser) {
        fetchSeq.current++; // cancel any in-flight profile fetch
        userIdRef.current = null;
        hasProfileRef.current = false;
        setUser(null);
        setProfile(null);
        setLoading(false);
        setAuthLoading(false);
        return;
      }

      const sameUser = userIdRef.current === authUser.id;
      userIdRef.current = authUser.id;

      // Keep the same object for the same user, so effects keyed on `user`
      // don't re-run on every token refresh or tab focus.
      setUser((prev) => (prev?.id === authUser.id ? prev : authUser));
      setAuthLoading(false);

      // Token refreshes and focus re-checks don't change the profile.
      if (sameUser && (event === "TOKEN_REFRESHED" || event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        return;
      }

      if (!sameUser) {
        hasProfileRef.current = false;
        setProfile(null);
        setLoading(true);
      }

      // Outside the auth lock.
      setTimeout(() => {
        if (mounted) fetchProfile(authUser);
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Absolute safety net: no loading state may last forever.
  useEffect(() => {
    if (!loading && !authLoading) return;
    const timeout = setTimeout(() => {
      setLoading(false);
      setAuthLoading(false);
    }, LOADING_SAFETY_MS);
    return () => clearTimeout(timeout);
  }, [loading, authLoading]);

  return (
    <UserContext.Provider value={{ user, profile, loading, authLoading, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
