"use client";

import { useEffect, useState } from "react";
import { money, MENU_CATEGORY_OPTIONS } from "@/lib/menu";
import { supabase } from "@/lib/supabase";
import {
  deleteMenuItem,
  fetchMenuAdmin,
  upsertMenuItem,
} from "@/lib/staff-api";
import type { MenuAdminRow } from "@/lib/staff-types";

const empty: Partial<MenuAdminRow> & {
  title: string;
  category: string;
  price: number;
} = {
  title: "",
  category: "Curries",
  price: 0,
  description: "",
  image_url: "",
  is_available: true,
  current_stock: 20,
  low_stock_threshold: 5,
};

export default function MenuAdminPanel() {
  const [items, setItems] = useState<MenuAdminRow[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function reload() {
    try {
      setItems(await fetchMenuAdmin());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load menu");
    }
  }

  useEffect(() => {
    void reload();
  }, []);

  async function save() {
    if (!form.title.trim()) {
      setError("Title is required");
      return;
    }
    setBusy(true);
    try {
      await upsertMenuItem(form);
      setForm(empty);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    if (!confirm("Delete this menu item?")) return;
    setBusy(true);
    try {
      await deleteMenuItem(id);
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(file: File) {
    if (!supabase) {
      setError("Supabase is not configured");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) throw new Error("Sign in again to upload");

      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/staff/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        throw new Error(json.error || "Upload failed");
      }
      setForm((prev) => ({ ...prev, image_url: json.url }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className="staff-panel">
      <h2>Menu admin</h2>
      <p className="staff-lead">Create, edit, and toggle availability (manager).</p>
      {error && <div className="error-banner">{error}</div>}

      <div className="staff-form staff-card">
        <h3>{form.id ? `Edit #${form.id}` : "New item"}</h3>
        <div className="staff-form-row">
          <label>
            Title
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label>
            Category
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {MENU_CATEGORY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Description
          <textarea
            rows={2}
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </label>
        <div className="staff-form-row">
          <label>
            Price (MMK)
            <input
              type="number"
              value={form.price}
              onChange={(e) =>
                setForm({ ...form, price: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label>
            Image URL / Cloudinary id
            <input
              value={form.image_url ?? ""}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
          </label>
        </div>
        <label>
          Upload image
          <input
            type="file"
            accept="image/*"
            disabled={uploading || busy}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadImage(file);
              e.target.value = "";
            }}
          />
          <span className="muted">
            {uploading
              ? "Uploading…"
              : "Needs CLOUDINARY_API_KEY + CLOUDINARY_API_SECRET on the server"}
          </span>
        </label>
        <div className="staff-form-row">
          <label>
            Stock
            <input
              type="number"
              value={form.current_stock ?? 20}
              onChange={(e) =>
                setForm({
                  ...form,
                  current_stock: Number(e.target.value) || 0,
                })
              }
            />
          </label>
          <label>
            Available
            <select
              value={form.is_available === false ? "no" : "yes"}
              onChange={(e) =>
                setForm({ ...form, is_available: e.target.value === "yes" })
              }
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
        </div>
        <div className="staff-top-actions">
          <button type="button" className="staff-btn" disabled={busy} onClick={() => void save()}>
            {busy ? "Saving…" : form.id ? "Update" : "Create"}
          </button>
          {form.id ? (
            <button
              type="button"
              className="staff-btn-secondary"
              onClick={() => setForm(empty)}
            >
              Cancel edit
            </button>
          ) : null}
        </div>
      </div>

      <div className="staff-list">
        {items.map((item) => (
          <article key={item.id} className="staff-card">
            <div className="staff-row">
              <div>
                <h3>
                  {item.title}{" "}
                  <span className="muted">· {item.category}</span>
                </h3>
                <p className="muted">
                  {money(item.price)} · stock {item.current_stock} ·{" "}
                  {item.is_available ? "available" : "hidden"}
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
                  onClick={() => void remove(item.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
