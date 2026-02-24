"use client";

import { FormEvent, useEffect, useState } from "react";

type MediaItem = {
  _id: string;
  title: string;
  type: "image" | "video";
  mediaUrl: string;
  thumbnailUrl?: string;
  linkUrl?: string;
  placement: "hero" | "ads";
  order: number;
  isActive: boolean;
};

const initial = {
  title: "",
  type: "image" as "image" | "video",
  mediaUrl: "",
  thumbnailUrl: "",
  linkUrl: "",
  placement: "ads" as "hero" | "ads",
  order: 0,
  isActive: true
};

export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [form, setForm] = useState(initial);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/landing-media", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok) {
      setError(data?.message || "Could not load media.");
      setItems([]);
    } else {
      setItems(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/admin/landing-media", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data?.message || "Could not create media.");
      return;
    }
    setForm(initial);
    await load();
  }

  async function toggleActive(item: MediaItem) {
    await fetch(`/api/admin/landing-media/${item._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !item.isActive })
    });
    await load();
  }

  async function remove(item: MediaItem) {
    await fetch(`/api/admin/landing-media/${item._id}`, { method: "DELETE" });
    await load();
  }

  return (
    <main className="container-page">
      <h1 className="text-3xl font-bold">Admin Media Dashboard</h1>
      <p className="mt-2 text-white/75">Manage landing page photos, videos, and advertisement cards.</p>

      <form onSubmit={onCreate} className="glass-panel mt-6 grid gap-3 p-5 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm text-white/80">Title</span>
          <input className="input" value={form.title} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-white/80">Type</span>
          <select className="input" value={form.type} onChange={(e) => setForm((s) => ({ ...s, type: e.target.value as any }))}>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm text-white/80">Media URL (YouTube/Vimeo/Facebook public URL or image URL)</span>
          <input className="input" value={form.mediaUrl} onChange={(e) => setForm((s) => ({ ...s, mediaUrl: e.target.value }))} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-white/80">Thumbnail URL (optional)</span>
          <input className="input" value={form.thumbnailUrl} onChange={(e) => setForm((s) => ({ ...s, thumbnailUrl: e.target.value }))} />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-white/80">Link URL (optional)</span>
          <input className="input" value={form.linkUrl} onChange={(e) => setForm((s) => ({ ...s, linkUrl: e.target.value }))} />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-white/80">Placement</span>
          <select className="input" value={form.placement} onChange={(e) => setForm((s) => ({ ...s, placement: e.target.value as any }))}>
            <option value="ads">Ads</option>
            <option value="hero">Hero</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm text-white/80">Order</span>
          <input className="input" type="number" min={0} value={form.order} onChange={(e) => setForm((s) => ({ ...s, order: Number(e.target.value) || 0 }))} />
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-white/85">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((s) => ({ ...s, isActive: e.target.checked }))} />
          Active
        </label>
        <button className="btn-primary md:col-span-2" disabled={saving}>
          {saving ? "Saving..." : "Create Media Item"}
        </button>
      </form>

      {error ? <p className="mt-3 text-red-300">{error}</p> : null}

      <section className="mt-6 space-y-3">
        {loading ? <p className="text-white/70">Loading...</p> : null}
        {!loading && items.length === 0 ? <p className="text-white/70">No media items yet.</p> : null}
        {items.map((item) => (
          <article key={item._id} className="glass-panel flex flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <p className="font-semibold text-white">{item.title}</p>
              <p className="text-sm text-white/70">
                {item.type.toUpperCase()} · {item.placement} · order {item.order} · {item.isActive ? "active" : "inactive"}
              </p>
              <p className="mt-1 max-w-2xl break-all text-xs text-white/60">{item.mediaUrl}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="btn-muted" onClick={() => toggleActive(item)}>
                {item.isActive ? "Disable" : "Enable"}
              </button>
              <button type="button" className="btn-muted" onClick={() => remove(item)}>
                Delete
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
