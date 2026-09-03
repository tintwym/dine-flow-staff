"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "./supabase";
import type { StaffProfile, StaffRole } from "./staff-types";

type StaffAuthState = {
  loading: boolean;
  profile: StaffProfile | null;
  email: string | null;
  stationLocked: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  unlockStation: (pin: string) => boolean;
  lockStation: () => void;
};

const StaffAuthContext = createContext<StaffAuthState | null>(null);

async function loadProfile(userId: string): Promise<StaffProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("staff_profiles")
    .select("user_id, role, display_name, pin_code")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data as StaffProfile;
}

export function StaffAuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [stationLocked, setStationLocked] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    async function syncSession() {
      if (!supabase) return;
      const { data } = await supabase.auth.getSession();
      const session = data.session;
      if (!session?.user) {
        if (!cancelled) {
          setProfile(null);
          setEmail(null);
          setLoading(false);
        }
        return;
      }
      const p = await loadProfile(session.user.id);
      if (!cancelled) {
        setEmail(session.user.email ?? null);
        setProfile(p);
        setLoading(false);
      }
    }

    void syncSession();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void (async () => {
        if (!session?.user) {
          setProfile(null);
          setEmail(null);
          setStationLocked(false);
          setLoading(false);
          return;
        }
        setEmail(session.user.email ?? null);
        const p = await loadProfile(session.user.id);
        setProfile(p);
        setLoading(false);
      })();
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (emailInput: string, password: string) => {
    if (!supabase) throw new Error("Supabase is not configured");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: emailInput.trim(),
      password,
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error("Sign-in failed");
    const p = await loadProfile(data.user.id);
    if (!p) {
      await supabase.auth.signOut();
      throw new Error(
        "No staff profile for this account. Run supabase/sql/seed-staff.sql after creating Auth users.",
      );
    }
    setEmail(data.user.email ?? null);
    setProfile(p);
    setStationLocked(false);
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setProfile(null);
    setEmail(null);
    setStationLocked(false);
  }, []);

  const unlockStation = useCallback(
    (pin: string) => {
      if (!profile) return false;
      if (pin.trim() === profile.pin_code) {
        setStationLocked(false);
        return true;
      }
      return false;
    },
    [profile],
  );

  const lockStation = useCallback(() => setStationLocked(true), []);

  const value = useMemo(
    () => ({
      loading,
      profile,
      email,
      stationLocked,
      signIn,
      signOut,
      unlockStation,
      lockStation,
    }),
    [
      loading,
      profile,
      email,
      stationLocked,
      signIn,
      signOut,
      unlockStation,
      lockStation,
    ],
  );

  return (
    <StaffAuthContext.Provider value={value}>{children}</StaffAuthContext.Provider>
  );
}

export function useStaffAuth() {
  const ctx = useContext(StaffAuthContext);
  if (!ctx) throw new Error("useStaffAuth requires StaffAuthProvider");
  return ctx;
}

export function roleLabel(role: StaffRole) {
  switch (role) {
    case "kitchen":
      return "Kitchen";
    case "floor":
      return "Floor";
    case "cashier":
      return "Cashier";
    case "manager":
      return "Manager";
  }
}
