"use client";

import { useEffect, useState } from "react";
import { money } from "@/lib/menu";
import { fetchStaffOrders, subscribeStaffRealtime } from "@/lib/staff-api";
import type { StaffOrder } from "@/lib/staff-types";

export default function HistoryPanel() {
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function reload() {
    try {
      setOrders(await fetchStaffOrders(50));
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load history");
    }
  }

  useEffect(() => {
    void reload();
    return subscribeStaffRealtime(() => {
      void reload();
    });
  }, []);

  return (
    <section className="staff-panel">
      <h2>Order history</h2>
      <p className="staff-lead">Recent orders with real line items from Supabase.</p>
      {error && <div className="error-banner">{error}</div>}
      {!orders.length ? (
        <div className="empty-state">No orders yet.</div>
      ) : (
        <div className="staff-list">
          {orders.map((order) => (
            <article key={order.id} className="staff-card">
              <div className="staff-row">
                <h3>
                  #{order.id} · T{order.table_number} · {order.guest_name}
                </h3>
                <span className={`staff-badge ${order.is_paid ? "ok" : "warn"}`}>
                  {order.status} · {order.is_paid ? "Paid" : "Unpaid"}
                </span>
              </div>
              <p className="muted">
                {new Date(order.timestamp).toLocaleString()} ·{" "}
                {money(order.total_amount)} · {order.payment_method}
              </p>
              <ul className="ticket-items">
                {(order.order_items ?? []).length ? (
                  (order.order_items ?? []).map((item) => (
                    <li key={item.id}>
                      {item.quantity}× {item.menu_item_name} · {money(item.price)}
                    </li>
                  ))
                ) : (
                  <li className="muted">No line items recorded for this order.</li>
                )}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
