"use client";

import { useEffect, useState } from "react";
import { money } from "@/lib/menu";
import { fetchLoyalty, upsertLoyalty } from "@/lib/staff-api";
import type { LoyaltyRow } from "@/lib/staff-types";

const empty = {
  name: "",
  phone: "",
  email: "",
  points: 0,
  tier: "SILVER",
  total_spent: 0,
};

export default function LoyaltyPanel() {
  const [rows, setRows] = useState<LoyaltyRow[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      setRows(await fetchLoyalty());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load loyalty");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function save() {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    try {
      await upsertLoyalty(form);
      setForm(empty);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="staff-panel">
      <h2>Loyalty</h2>
      <p className="staff-lead">Members, points, and tiers in the cloud.</p>
      {error && <div className="error-banner">{error}</div>}

      <div className="staff-form staff-card">
        <div className="staff-form-row">
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Phone
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>
        </div>
        <div className="staff-form-row">
          <label>
            Points
            <input
              type="number"
              value={form.points}
              onChange={(e) =>
                setForm({ ...form, points: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label>
            Tier
            <select
              value={form.tier}
              onChange={(e) => setForm({ ...form, tier: e.target.value })}
            >
              <option value="SILVER">SILVER</option>
              <option value="GOLD">GOLD</option>
              <option value="PLATINUM">PLATINUM</option>
            </select>
          </label>
        </div>
        <button type="button" className="staff-btn" disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : "Add member"}
        </button>
      </div>

      <div className="staff-list">
        {rows.map((r) => (
          <article key={r.id} className="staff-card staff-row">
            <div>
              <h3>
                {r.name} <span className="staff-badge">{r.tier}</span>
              </h3>
              <p className="muted">
                {r.phone || "—"} · {r.points} pts · spent {money(r.total_spent)}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
