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

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const isInitialized = useRef(false);

  const fetchProfile = useCallback(async (authUser: User, retry = true) => {
    const userId = authUser.id;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("UserProvider: Error fetching profile:", error);
        if (retry) {
          await new Promise((r) => setTimeout(r, 800));
          return fetchProfile(authUser, false);
        }
        // Do NOT clobber an existing profile on a transient failure.
        setProfile((prev) => prev);
      } else if (data) {
        setProfile(data);
      } else {
        // No row exists yet for this authenticated user. Create one so the
        // profile card always has data, then use the returned row.
        const fallback = {
          id: userId,
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
          console.error("UserProvider: Error creating profile:", upsertError);
          // As a last resort, surface the fallback so the UI isn't blank.
          setProfile(fallback as UserProfile);
        } else if (created) {
          setProfile(created);
        }
      }
    } catch (err) {
      console.error("UserProvider: Unexpected error fetching profile:", err);
      if (retry) {
        await new Promise((r) => setTimeout(r, 800));
        return fetchProfile(authUser, false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    let mounted = true;

    // 1. Initial Session Check
    const initSession = async () => {
      try {
        setAuthLoading(true);
        const { data: { session }, error } = await supabase.auth.getSession();
        
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

    // 2. Listen for Auth Changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        // TOKEN_REFRESHED fires periodically; the user/profile are unchanged,
        // so don't re-trigger loading states or refetch needlessly.
        if (event === "TOKEN_REFRESHED") {
          if (session?.user) setUser(session.user);
          setAuthLoading(false);
          return;
        }

        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user);
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
        setAuthLoading(false);
      }
    );

    // 3. Absolute Safety Timeout
    const timeout = setTimeout(() => {
      if (mounted) {
        setLoading(false);
        setAuthLoading(false);
      }
    }, 6000);

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
