"use client";

import { useEffect, useState } from "react";
import { money } from "@/lib/menu";
import {
  fetchStaffOrders,
  fetchTables,
  markOrderPaid,
  subscribeStaffRealtime,
  updateTableStatus,
} from "@/lib/staff-api";
import type { StaffOrder, TableRow } from "@/lib/staff-types";

type Props = {
  selectedTable: number | null;
  onSelectTable: (n: number) => void;
};

export default function FloorPanel({ selectedTable, onSelectTable }: Props) {
  const [tables, setTables] = useState<TableRow[]>([]);
  const [orders, setOrders] = useState<StaffOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      const [t, o] = await Promise.all([fetchTables(), fetchStaffOrders(40)]);
      setTables(t);
      setOrders(o);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load floor");
    }
  }

  useEffect(() => {
    void reload();
    return subscribeStaffRealtime(() => {
      void reload();
    });
  }, []);

  const openForTable = (n: number) =>
    orders.find(
      (o) =>
        o.table_number === n && !["COMPLETED", "CANCELLED"].includes(o.status),
    );

  async function clearTable(n: number) {
    setBusy(true);
    try {
      await updateTableStatus(n, "AVAILABLE", null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not clear table");
    } finally {
      setBusy(false);
    }
  }

  async function payOrder(orderId: number, method: "CASH" | "CARD_DEMO") {
    setBusy(true);
    try {
      await markOrderPaid(orderId, method);
      const order = orders.find((o) => o.id === orderId);
      if (order) await updateTableStatus(order.table_number, "AVAILABLE", null);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not mark paid");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="staff-panel">
      <h2>Cashier / bills</h2>
      <p className="staff-lead">
        Select a table to collect payment, or clear the table when settled.
      </p>
      {error && <div className="error-banner">{error}</div>}
      <div className="staff-grid">
        {tables.map((t) => {
          const open = openForTable(t.table_number);
          return (
            <button
              key={t.table_number}
              type="button"
              className={`staff-card table-tile ${t.status} ${
                selectedTable === t.table_number ? "selected" : ""
              }`}
              onClick={() => onSelectTable(t.table_number)}
            >
              <div className="staff-row">
                <h3>Table {t.table_number}</h3>
                <span className="staff-badge">{t.status}</span>
              </div>
              <p className="muted">
                Seats {t.capacity}
                {open
                  ? ` · #${open.id} · ${money(open.total_amount)}${
                      open.is_paid ? " · paid" : " · unpaid"
                    }`
                  : ""}
              </p>
            </button>
          );
        })}
      </div>

      {selectedTable != null && (
        <div className="staff-card" style={{ marginTop: 16 }}>
          <h3>Table {selectedTable}</h3>
          {(() => {
            const open = openForTable(selectedTable);
            if (!open) {
              return (
                <p className="muted">
                  No open order. Use the Order tab to place one for this table.
                </p>
              );
            }
            return (
              <div className="staff-list">
                <p>
                  Order #{open.id} · {open.status} · {money(open.total_amount)} ·{" "}
                  {open.is_paid ? "Paid" : "Unpaid"} ({open.payment_method})
                </p>
                <div className="staff-top-actions">
                  {!open.is_paid && (
                    <>
                      <button
                        type="button"
                        className="staff-btn"
                        disabled={busy}
                        onClick={() => void payOrder(open.id, "CASH")}
                      >
                        Mark paid · Cash
                      </button>
                      <button
                        type="button"
                        className="staff-btn-secondary"
                        disabled={busy}
                        onClick={() => void payOrder(open.id, "CARD_DEMO")}
                      >
                        Mark paid · Card
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    className="staff-btn-secondary"
                    disabled={busy}
                    onClick={() => void clearTable(selectedTable)}
                  >
                    Clear table
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </section>
  );
}
