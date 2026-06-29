"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "./client";
import { User } from "@supabase/supabase-js";

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  active_plan: string;
  trial_ends_at: string | null;
  subscription_status: string;
  stripe_customer_id: string | null;
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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const isInitialized = useRef(false);

  // ---------------------------------------------------------------------------
  // fetchProfile
  // Tries to load the profile row. If it does not exist yet (the trigger may
  // not have fired yet on very fresh signups) we retry a few times before
  // attempting an upsert ourselves. Any DB error is treated as non-fatal so
  // that signup / login is never blocked.
  // ---------------------------------------------------------------------------
  const fetchProfile = useCallback(async (authUser: User, attempt = 0) => {
    const userId = authUser.id;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("UserProvider: Error fetching profile:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });

        // Keep whatever profile we already have; don't blank it on a
        // transient network / RLS error.
        if (attempt < MAX_PROFILE_RETRIES) {
          await delay(RETRY_DELAY_MS);
          return fetchProfile(authUser, attempt + 1);
        }
        return;
      }

      if (data) {
        setProfile(data);
        return;
      }

      // Row not found yet. The trigger may still be running.
      if (attempt < MAX_PROFILE_RETRIES) {
        await delay(RETRY_DELAY_MS * (attempt + 1)); // back-off
        return fetchProfile(authUser, attempt + 1);
      }

      // Exhausted retries — create the row ourselves so the UI is never blank.
      await upsertFallbackProfile(authUser);
    } catch (err) {
      console.error("UserProvider: Unexpected error fetching profile:", err);
      if (attempt < MAX_PROFILE_RETRIES) {
        await delay(RETRY_DELAY_MS);
        return fetchProfile(authUser, attempt + 1);
      }
    } finally {
      // Always clear the loading state once we are done, regardless of outcome.
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // upsertFallbackProfile
  // Last-resort: create the profile row on the client side when the DB trigger
  // did not do so (e.g. it threw and was silenced). This is idempotent thanks
  // to ON CONFLICT DO NOTHING in the SQL.
  // ---------------------------------------------------------------------------
  const upsertFallbackProfile = useCallback(async (authUser: User) => {
    const fallback: Partial<UserProfile> = {
      id: authUser.id,
      email: authUser.email ?? null,
      full_name:
        (authUser.user_metadata?.full_name as string) ??
        (authUser.user_metadata?.name as string) ??
        null,
      role: "user",
      active_plan: "Free",
      subscription_status: "active",
    };

    const { data: created, error: upsertError } = await supabase
      .from("profiles")
      .upsert(fallback, { onConflict: "id" })
      .select("*")
      .maybeSingle();

    if (upsertError) {
      console.error("UserProvider: Error upserting fallback profile:", {
        message: upsertError.message,
        details: upsertError.details,
        hint: upsertError.hint,
        code: upsertError.code,
      });
      // Surface the local fallback object so the UI still has something to show.
      setProfile(fallback as UserProfile);
    } else if (created) {
      setProfile(created);
    } else {
      setProfile(fallback as UserProfile);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      setLoading(true);
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  // ---------------------------------------------------------------------------
  // Bootstrap: initial session check + ongoing auth-state listener
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    let mounted = true;

    const initSession = async () => {
      try {
        setAuthLoading(true);
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("UserProvider: getSession error:", error.message);
        }

        if (mounted) {
          if (session?.user) {
            setUser(session.user);
            await fetchProfile(session.user);
          } else {
            setUser(null);
            setProfile(null);
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("UserProvider: Auth init failed:", err);
        if (mounted) setLoading(false);
      } finally {
        if (mounted) setAuthLoading(false);
      }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // TOKEN_REFRESHED: only update the user object; don't re-fetch the
      // profile because it hasn't changed.
      if (event === "TOKEN_REFRESHED") {
        if (session?.user) setUser(session.user);
        setAuthLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        // On a fresh signup the profile row may not exist yet — fetchProfile
        // handles retries and the fallback upsert automatically.
        await fetchProfile(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setProfile(null);
        setLoading(false);
      }

      setAuthLoading(false);
    });

    // Absolute safety timeout: never leave the app in a permanent loading state.
    const timeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
        setAuthLoading(false);
      }
    }, 8000);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [fetchProfile]);

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
