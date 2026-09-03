"use client";

import { useEffect, useState } from "react";
import {
  deleteReservation,
  fetchReservations,
  upsertReservation,
} from "@/lib/staff-api";
import type { ReservationRow } from "@/lib/staff-types";

const empty = {
  guest_name: "",
  guest_phone: "",
  guest_email: "",
  party_size: 2,
  reservation_date: "",
  reservation_time: "19:00",
  special_requests: "",
  status: "CONFIRMED",
};

export default function ReservationsPanel() {
  const [rows, setRows] = useState<ReservationRow[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      setRows(await fetchReservations());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reservations");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function save() {
    if (!form.guest_name || !form.reservation_date) {
      setError("Name and date are required");
      return;
    }
    setBusy(true);
    try {
      await upsertReservation(form);
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
      <h2>Reservations</h2>
      <p className="staff-lead">Book and manage table reservations.</p>
      {error && <div className="error-banner">{error}</div>}

      <div className="staff-form staff-card">
        <div className="staff-form-row">
          <label>
            Guest
            <input
              value={form.guest_name}
              onChange={(e) => setForm({ ...form, guest_name: e.target.value })}
            />
          </label>
          <label>
            Phone
            <input
              value={form.guest_phone}
              onChange={(e) => setForm({ ...form, guest_phone: e.target.value })}
            />
          </label>
        </div>
        <div className="staff-form-row">
          <label>
            Date
            <input
              type="date"
              value={form.reservation_date}
              onChange={(e) =>
                setForm({ ...form, reservation_date: e.target.value })
              }
            />
          </label>
          <label>
            Time
            <input
              type="time"
              value={form.reservation_time}
              onChange={(e) =>
                setForm({ ...form, reservation_time: e.target.value })
              }
            />
          </label>
        </div>
        <div className="staff-form-row">
          <label>
            Party size
            <input
              type="number"
              value={form.party_size}
              onChange={(e) =>
                setForm({ ...form, party_size: Number(e.target.value) || 2 })
              }
            />
          </label>
          <label>
            Status
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="CONFIRMED">CONFIRMED</option>
              <option value="SEATED">SEATED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
          </label>
        </div>
        <button type="button" className="staff-btn" disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : "Save reservation"}
        </button>
      </div>

      <div className="staff-list">
        {rows.map((r) => (
          <article key={r.id} className="staff-card staff-row">
            <div>
              <h3>
                {r.guest_name} · {r.party_size} guests
              </h3>
              <p className="muted">
                {r.reservation_date} {r.reservation_time} · {r.status} ·{" "}
                {r.confirmation_code}
              </p>
            </div>
            <button
              type="button"
              className="staff-btn-danger"
              onClick={() =>
                void (async () => {
                  await deleteReservation(r.id);
                  await reload();
                })()
              }
            >
              Delete
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
