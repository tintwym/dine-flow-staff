"use client";

import { useEffect, useMemo, useState } from "react";
import { money, type CartLine, type MenuItem } from "@/lib/menu";
import { fetchMenuForStaff, placeStaffOrder } from "@/lib/staff-api";

type Props = {
  selectedTable: number | null;
};

export default function OrderPanel({ selectedTable }: Props) {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [payMethod, setPayMethod] = useState<"COUNTER" | "CASH" | "CARD_DEMO">(
    "COUNTER",
  );
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setMenu(await fetchMenuForStaff());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load menu");
      }
    })();
  }, []);

  const total = useMemo(
    () => cart.reduce((s, l) => s + l.unitPrice * l.quantity, 0),
    [cart],
  );
  const tax = Math.round(total * 0.08 * 100) / 100;

  function addItem(item: MenuItem) {
    setCart((prev) => {
      const existing = prev.find((l) => l.menuItemId === item.id);
      if (existing) {
        return prev.map((l) =>
          l.menuItemId === item.id ? { ...l, quantity: l.quantity + 1 } : l,
        );
      }
      return [
        ...prev,
        {
          key: `staff-${item.id}-${Date.now()}`,
          menuItemId: item.id,
          title: item.title,
          unitPrice: item.price,
          quantity: 1,
          spiceLevel: "Normal",
          note: "",
          imageUrl: item.image_url || "",
        },
      ];
    });
    setMessage(null);
  }

  async function submit() {
    if (selectedTable == null) {
      setError("Select a table on the Floor tab first.");
      return;
    }
    if (!cart.length) {
      setError("Cart is empty.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const isPaid = payMethod === "CASH" || payMethod === "CARD_DEMO";
      const result = await placeStaffOrder(
        selectedTable,
        cart,
        "Walk-in",
        payMethod,
        isPaid,
      );
      setCart([]);
      setMessage(`Order #${result.orderId} placed · ${result.label}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not place order");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="staff-panel">
      <h2>Staff order</h2>
      <p className="staff-lead">
        {selectedTable != null
          ? `Ordering for table ${selectedTable}.`
          : "Pick a table on Floor first."}
      </p>
      {error && <div className="error-banner">{error}</div>}
      {message && <div className="staff-badge ok">{message}</div>}

      <div className="order-menu-grid">
        {menu
          .filter((m) => m.is_available)
          .map((item) => (
            <button
              key={item.id}
              type="button"
              className="menu-pick"
              onClick={() => addItem(item)}
            >
              <strong>{item.title}</strong>
              <div className="muted">{money(item.price)}</div>
            </button>
          ))}
      </div>

      <div className="cart-bar">
        <div>
          <strong>{cart.reduce((s, l) => s + l.quantity, 0)} items</strong>
          <div className="muted">
            {money(total + tax)} incl. tax
          </div>
          <label className="muted" style={{ display: "block", marginTop: 8 }}>
            Payment{" "}
            <select
              value={payMethod}
              onChange={(e) =>
                setPayMethod(e.target.value as "COUNTER" | "CASH" | "CARD_DEMO")
              }
            >
              <option value="COUNTER">Pay at counter</option>
              <option value="CASH">Cash (mark paid)</option>
              <option value="CARD_DEMO">Card demo (mark paid)</option>
            </select>
          </label>
        </div>
        <div className="staff-top-actions">
          <button
            type="button"
            className="staff-btn-secondary"
            onClick={() => setCart([])}
            disabled={!cart.length || busy}
          >
            Clear
          </button>
          <button
            type="button"
            className="staff-btn"
            onClick={() => void submit()}
            disabled={busy || !cart.length || selectedTable == null}
          >
            {busy ? "Sending…" : "Send to kitchen"}
          </button>
        </div>
      </div>
    </section>
  );
}
