"use client";

import { useEffect, useState } from "react";
import { money } from "@/lib/menu";
import {
  advanceOrderStatus,
  fetchActiveKitchenOrders,
  subscribeStaffRealtime,
} from "@/lib/staff-api";
import type { StaffOrder } from "@/lib/staff-types";
import { nextOrderStatus } from "@/lib/staff-types";

export default function KitchenPanel() {
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  async function reload() {
    try {
      setOrders(await fetchActiveKitchenOrders());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load kitchen");
    }
  }

  useEffect(() => {
    void reload();
    return subscribeStaffRealtime(() => {
      void reload();
    });
  }, []);

  async function advance(order: StaffOrder) {
    setBusyId(order.id);
    try {
      await advanceOrderStatus(order);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update status");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="staff-panel">
      <h2>Kitchen display</h2>
      <p className="staff-lead">Live tickets — advance each order through prep.</p>
      {error && <div className="error-banner">{error}</div>}
      {!orders.length ? (
        <div className="empty-state">No open kitchen tickets.</div>
      ) : (
        <div className="staff-grid">
          {orders.map((order) => {
            const next = nextOrderStatus(order.status);
            return (
              <article key={order.id} className="staff-card">
                <div className="staff-row">
                  <h3>
                    T{order.table_number} · #{order.id}
                  </h3>
                  <span className="staff-badge busy">{order.status}</span>
                </div>
                <p className="muted">
                  {order.guest_name} · {money(order.total_amount)}
                </p>
                {order.special_notes ? (
                  <p className="muted">{order.special_notes}</p>
                ) : null}
                <ul className="ticket-items">
                  {(order.order_items ?? []).map((item) => (
                    <li key={item.id}>
                      <strong>{item.quantity}×</strong> {item.menu_item_name}
                      {item.customization ? (
                        <span className="muted"> — {item.customization}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
                {next ? (
                  <button
                    type="button"
                    className="staff-btn"
                    disabled={busyId === order.id}
                    onClick={() => void advance(order)}
                  >
                    {busyId === order.id ? "Updating…" : `Mark ${next}`}
                  </button>
                ) : null}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
