"use client";

import { useEffect, useMemo, useState } from "react";
import { money } from "@/lib/menu";
import {
  deleteInventoryItem,
  fetchInventory,
  upsertInventoryItem,
} from "@/lib/staff-api";
import type { InventoryRow } from "@/lib/staff-types";

const empty = {
  name: "",
  category: "Raw Ingredient",
  current_quantity: 0,
  unit: "units",
  min_threshold: 0,
  reorder_quantity: 0,
  unit_cost: 0,
};

export default function InventoryPanel() {
  const [items, setItems] = useState<InventoryRow[]>([]);
  const [form, setForm] = useState<Partial<InventoryRow> & typeof empty>(empty);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function reload() {
    try {
      setItems(await fetchInventory());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load inventory");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  const lowStock = useMemo(
    () => items.filter((i) => i.current_quantity <= i.min_threshold),
    [items],
  );

  const visible = useMemo(() => {
    if (filter === "Low Stock") return items.filter((i) => i.current_quantity <= i.min_threshold * 1.5);
    if (filter === "All") return items;
    return items.filter((i) => i.category === filter);
  }, [items, filter]);

  async function save() {
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    setBusy(true);
    try {
      await upsertInventoryItem(form);
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
      <h2>Inventory</h2>
      <p className="staff-lead">Cloud stock levels with live low-stock alerts.</p>
      {error && <div className="error-banner">{error}</div>}

      {lowStock.length > 0 && (
        <div className="error-banner" role="status">
          <strong>{lowStock.length} low-stock alert{lowStock.length > 1 ? "s" : ""}:</strong>{" "}
          {lowStock.map((i) => i.name).join(", ")}
        </div>
      )}

      <div className="staff-top-actions" style={{ marginBottom: 12 }}>
        {["All", "Low Stock", "Raw Ingredient", "Beverage Base", "Packaging"].map(
          (f) => (
            <button
              key={f}
              type="button"
              className={filter === f ? "staff-btn" : "staff-btn-secondary"}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ),
        )}
      </div>

      <div className="staff-form staff-card">
        <h3>{form.id ? `Edit #${form.id}` : "Add item"}</h3>
        <div className="staff-form-row">
          <label>
            Name
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label>
            Category
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              <option>Raw Ingredient</option>
              <option>Beverage Base</option>
              <option>Packaging</option>
            </select>
          </label>
        </div>
        <div className="staff-form-row">
          <label>
            Qty
            <input
              type="number"
              value={form.current_quantity}
              onChange={(e) =>
                setForm({
                  ...form,
                  current_quantity: Number(e.target.value) || 0,
                })
              }
            />
          </label>
          <label>
            Unit
            <input
              value={form.unit}
              onChange={(e) => setForm({ ...form, unit: e.target.value })}
            />
          </label>
        </div>
        <div className="staff-form-row">
          <label>
            Min threshold
            <input
              type="number"
              value={form.min_threshold}
              onChange={(e) =>
                setForm({
                  ...form,
                  min_threshold: Number(e.target.value) || 0,
                })
              }
            />
          </label>
          <label>
            Unit cost (MMK)
            <input
              type="number"
              value={form.unit_cost}
              onChange={(e) =>
                setForm({ ...form, unit_cost: Number(e.target.value) || 0 })
              }
            />
          </label>
        </div>
        <button type="button" className="staff-btn" disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : form.id ? "Update" : "Add"}
        </button>
      </div>

      <div className="staff-list">
        {visible.map((item) => {
          const low = item.current_quantity <= item.min_threshold;
          return (
            <article key={item.id} className="staff-card">
              <div className="staff-row">
                <div>
                  <h3>
                    {item.name}{" "}
                    {low ? <span className="staff-badge warn">Low</span> : null}
                  </h3>
                  <p className="muted">
                    {item.current_quantity} {item.unit} · min {item.min_threshold} ·{" "}
                    {money(item.unit_cost)}/{item.unit} · {item.category}
                  </p>
                </div>
                <div className="staff-top-actions">
                  <button
                    type="button"
                    className="staff-btn-secondary"
                    onClick={() => setForm(item)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="staff-btn-danger"
                    onClick={() =>
                      void (async () => {
                        await deleteInventoryItem(item.id);
                        await reload();
                      })()
                    }
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
