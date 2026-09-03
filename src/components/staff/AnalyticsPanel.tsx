"use client";

import { useEffect, useMemo, useState } from "react";
import { money } from "@/lib/menu";
import { computeAnalytics, fetchStaffOrders } from "@/lib/staff-api";
import type { StaffOrder } from "@/lib/staff-types";

export default function AnalyticsPanel() {
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setOrders(await fetchStaffOrders(200));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load analytics");
      }
    })();
  }, []);

  const stats = useMemo(() => computeAnalytics(orders), [orders]);

  return (
    <section className="staff-panel">
      <h2>Analytics</h2>
      <p className="staff-lead">Revenue and top dishes from cloud orders.</p>
      {error && <div className="error-banner">{error}</div>}
      <div className="staff-stats">
        <div className="staff-stat">
          <span className="muted">Orders</span>
          <strong>{stats.orderCount}</strong>
        </div>
        <div className="staff-stat">
          <span className="muted">Revenue</span>
          <strong>{money(stats.revenue)}</strong>
        </div>
        <div className="staff-stat">
          <span className="muted">Avg check</span>
          <strong>{money(stats.avgCheck)}</strong>
        </div>
        <div className="staff-stat">
          <span className="muted">Unpaid open</span>
          <strong>{stats.unpaidOpen}</strong>
        </div>
      </div>
      <h3>Top dishes</h3>
      {!stats.topDishes.length ? (
        <div className="empty-state">Not enough paid/completed orders yet.</div>
      ) : (
        <div className="staff-list">
          {stats.topDishes.map((d) => (
            <div key={d.name} className="staff-card staff-row">
              <div>
                <strong>{d.name}</strong>
                <div className="muted">{d.qty} sold</div>
              </div>
              <span>{money(d.revenue)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
