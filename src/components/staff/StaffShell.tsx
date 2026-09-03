"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { roleLabel, useStaffAuth } from "@/lib/staff-auth";
import { tabsForRole, type StaffTab } from "@/lib/staff-types";
import KitchenPanel from "./KitchenPanel";
import FloorPanel from "./FloorPanel";
import OrderPanel from "./OrderPanel";
import HistoryPanel from "./HistoryPanel";
import InventoryPanel from "./InventoryPanel";
import MenuAdminPanel from "./MenuAdminPanel";
import AnalyticsPanel from "./AnalyticsPanel";
import ReservationsPanel from "./ReservationsPanel";
import LoyaltyPanel from "./LoyaltyPanel";
import FeedbackPanel from "./FeedbackPanel";

export default function StaffShell() {
  const router = useRouter();
  const { profile, email, stationLocked, lockStation, unlockStation, signOut } =
    useStaffAuth();
  const tabs = useMemo(
    () => (profile ? tabsForRole(profile.role) : []),
    [profile],
  );
  const [tab, setTab] = useState<StaffTab>("kitchen");
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);

  const activeTab = tabs.some((t) => t.id === tab) ? tab : tabs[0]?.id;

  if (!profile) return null;

  return (
    <div className="staff-shell">
      <header className="staff-top">
        <div className="staff-brand-row">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="staff-brand-logo"
            src="/brand/dineflow-logo.png"
            alt=""
            width={44}
            height={44}
          />
          <div>
            <h1>DineFlow Office</h1>
            <div className="meta">
              {profile.display_name}
              {email ? ` · ${email}` : ""}
              {selectedTable != null ? ` · Table ${selectedTable}` : ""}
            </div>
            <span className="staff-role-chip">{roleLabel(profile.role)}</span>
          </div>
        </div>
        <div className="staff-top-actions">
          <a className="staff-btn ghost" href="/qrs">
            Print QRs
          </a>
          <button type="button" className="staff-btn ghost" onClick={lockStation}>
            Lock
          </button>
          <button
            type="button"
            className="staff-btn ghost"
            onClick={() =>
              void (async () => {
                await signOut();
                router.replace("/login");
              })()
            }
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="staff-main">
        {activeTab === "kitchen" && <KitchenPanel />}
        {activeTab === "floor" && (
          <FloorPanel
            selectedTable={selectedTable}
            onSelectTable={setSelectedTable}
          />
        )}
        {activeTab === "order" && <OrderPanel selectedTable={selectedTable} />}
        {activeTab === "history" && <HistoryPanel />}
        {activeTab === "inventory" && <InventoryPanel />}
        {activeTab === "menu" && <MenuAdminPanel />}
        {activeTab === "analytics" && <AnalyticsPanel />}
        {activeTab === "reservations" && <ReservationsPanel />}
        {activeTab === "loyalty" && <LoyaltyPanel />}
        {activeTab === "feedback" && <FeedbackPanel />}
      </main>

      <nav className="staff-nav" aria-label="Staff sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={activeTab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {stationLocked && (
        <div
          className="staff-lock"
          role="dialog"
          aria-modal="true"
          aria-label="Station locked"
        >
          <div className="staff-lock-card">
            <h2>Station locked</h2>
            <p className="staff-lead">Enter station PIN to continue.</p>
            <div className="staff-form">
              <label>
                PIN
                <input
                  type="password"
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  autoFocus
                />
              </label>
              {pinError && <div className="error-banner">{pinError}</div>}
              <button
                type="button"
                className="staff-btn"
                onClick={() => {
                  if (unlockStation(pin)) {
                    setPin("");
                    setPinError(null);
                  } else {
                    setPinError("Incorrect PIN");
                  }
                }}
              >
                Unlock
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
