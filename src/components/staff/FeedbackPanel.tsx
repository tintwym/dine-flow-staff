"use client";

import { useEffect, useState } from "react";
import { fetchFeedback, submitFeedback } from "@/lib/staff-api";
import type { FeedbackRow } from "@/lib/staff-types";

export default function FeedbackPanel() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("Guest");
  const [overall, setOverall] = useState(5);
  const [food, setFood] = useState(5);
  const [service, setService] = useState(5);
  const [comment, setComment] = useState("");
  const [orderId, setOrderId] = useState("");
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      setRows(await fetchFeedback());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feedback");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function save() {
    setBusy(true);
    try {
      await submitFeedback({
        guest_name: guestName,
        overall_rating: overall,
        food_quality_rating: food,
        service_speed_rating: service,
        comment,
        order_id: orderId ? Number(orderId) : null,
      });
      setComment("");
      setOrderId("");
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save feedback");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="staff-panel">
      <h2>Feedback</h2>
      <p className="staff-lead">Guest ratings linked to orders when provided.</p>
      {error && <div className="error-banner">{error}</div>}

      <div className="staff-form staff-card">
        <div className="staff-form-row">
          <label>
            Guest name
            <input value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          </label>
          <label>
            Order ID (optional)
            <input value={orderId} onChange={(e) => setOrderId(e.target.value)} />
          </label>
        </div>
        <div className="staff-form-row">
          <label>
            Overall (1–5)
            <input
              type="number"
              min={1}
              max={5}
              value={overall}
              onChange={(e) => setOverall(Number(e.target.value) || 5)}
            />
          </label>
          <label>
            Food
            <input
              type="number"
              min={1}
              max={5}
              value={food}
              onChange={(e) => setFood(Number(e.target.value) || 5)}
            />
          </label>
          <label>
            Service
            <input
              type="number"
              min={1}
              max={5}
              value={service}
              onChange={(e) => setService(Number(e.target.value) || 5)}
            />
          </label>
        </div>
        <label>
          Comment
          <textarea rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
        </label>
        <button type="button" className="staff-btn" disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : "Record feedback"}
        </button>
      </div>

      <div className="staff-list">
        {rows.map((r) => (
          <article key={r.id} className="staff-card">
            <div className="staff-row">
              <h3>
                {r.guest_name} · {r.overall_rating}/5
              </h3>
              <span className="muted">
                {new Date(r.timestamp).toLocaleString()}
              </span>
            </div>
            <p className="muted">
              Food {r.food_quality_rating}/5 · Service {r.service_speed_rating}/5
              {r.order_id ? ` · Order #${r.order_id}` : ""}
            </p>
            {r.comment ? <p>{r.comment}</p> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
