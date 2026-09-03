"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useStaffAuth } from "@/lib/staff-auth";

export default function StaffLoginForm() {
  const router = useRouter();
  const { signIn } = useStaffAuth();
  const [email, setEmail] = useState("manager@dineflow.local");
  const [password, setPassword] = useState("DineFlow1!");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Add env keys on Vercel.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace("/");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Sign-in failed";
      const lower = raw.toLowerCase();
      if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
        setError("Invalid email or password.");
      } else {
        setError(raw);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="staff-login">
      <form className="staff-login-card" onSubmit={onSubmit}>
        <div className="staff-login-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/dineflow-logo.png"
            alt="DineFlow"
            width={56}
            height={56}
          />
          <div>
            <h1>DineFlow Office</h1>
            <p className="staff-login-sub">Kitchen · Floor · Cashier · Manager</p>
          </div>
        </div>

        <p>Sign in on the counter PC or staff tablets. Same account works everywhere.</p>

        {!isSupabaseConfigured && (
          <div className="error-banner">Supabase env keys missing.</div>
        )}
        {error && <div className="error-banner">{error}</div>}

        <div className="staff-form">
          <label>
            Email
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          <button type="submit" className="staff-btn" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </div>

        <p className="staff-login-hint">
          Demo · <code>manager@dineflow.local</code> · <code>DineFlow1!</code>
        </p>
      </form>
    </div>
  );
}
