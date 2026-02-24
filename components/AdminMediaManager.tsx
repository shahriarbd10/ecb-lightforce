"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { toEmbedUrl } from "@/lib/media-embed";

type Placement = "hero" | "spotlight" | "reels" | "ads";

type MediaItem = {
  _id: string;
  title: string;
  type: "image" | "video";
  mediaUrl: string;
  thumbnailUrl?: string;
  linkUrl?: string;
  placement: Placement;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type FormState = {
  title: string;
  type: "image" | "video";
  mediaUrl: string;
  thumbnailUrl: string;
  linkUrl: string;
  placement: Placement;
  order: number;
  isActive: boolean;
};

const placements: { value: Placement; label: string; helper: string }[] = [
  { value: "hero", label: "Hero", helper: "Top section visuals" },
  { value: "spotlight", label: "Spotlight", helper: "Feature cards for campaigns" },
  { value: "reels", label: "Reels", helper: "Short clips and highlights" },
  { value: "ads", label: "Ads", helper: "Promo cards and sponsor blocks" }
];

const initial: FormState = {
  title: "",
  type: "image",
  mediaUrl: "",
  thumbnailUrl: "",
  linkUrl: "",
  placement: "hero",
  order: 0,
  isActive: true
};

function isVideoFile(url: string) {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}

async function uploadToCloudinary(file: File, purpose: string) {
  const signRes = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder: "ecb-lightforce/landing", purpose })
  });

  const signData = await signRes.json().catch(() => ({}));
  if (!signRes.ok) {
    throw new Error(signData?.message || "Could not generate upload signature.");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", signData.apiKey);
  formData.append("timestamp", String(signData.timestamp));
  formData.append("folder", signData.folder);
  formData.append("public_id", signData.publicId);
  formData.append("signature", signData.signature);

  const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/auto/upload`, {
    method: "POST",
    body: formData
  });

  const uploadData = await uploadRes.json().catch(() => ({}));
  if (!uploadRes.ok || !uploadData?.secure_url) {
    throw new Error(uploadData?.error?.message || "Cloudinary upload failed.");
  }

  return String(uploadData.secure_url);
}

export default function AdminMediaManager() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [form, setForm] = useState<FormState>(initial);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [placementFilter, setPlacementFilter] = useState<"all" | Placement>("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<"media" | "thumbnail" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/landing-media", { cache: "no-store" });
    const data = await res.json().catch(() => []);
    if (!res.ok) {
      setError(data?.message || "Could not load media.");
      setItems([]);
    } else {
      setItems(Array.isArray(data) ? (data as MediaItem[]) : []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const summary = useMemo(() => {
    const active = items.filter((item) => item.isActive).length;
    const byPlacement = placements.map((placement) => ({
      placement: placement.value,
      total: items.filter((item) => item.placement === placement.value).length
    }));

    return { total: items.length, active, byPlacement };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesPlacement = placementFilter === "all" || item.placement === placementFilter;
      const matchesSearch =
        !search ||
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.mediaUrl.toLowerCase().includes(search.toLowerCase());
      return matchesPlacement && matchesSearch;
    });
  }, [items, placementFilter, search]);

  const groupedItems = useMemo(() => {
    return placements.map((placement) => ({
      ...placement,
      items: filteredItems
        .filter((item) => item.placement === placement.value)
        .sort((a, b) => a.order - b.order)
    }));
  }, [filteredItems]);

  function resetForm() {
    setForm(initial);
    setEditingId(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const endpoint = editingId ? `/api/admin/landing-media/${editingId}` : "/api/admin/landing-media";
    const method = editingId ? "PATCH" : "POST";

    const res = await fetch(endpoint, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        title: form.title.trim(),
        mediaUrl: form.mediaUrl.trim(),
        thumbnailUrl: form.thumbnailUrl.trim(),
        linkUrl: form.linkUrl.trim()
      })
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(data?.message || "Could not save media item.");
      return;
    }

    setNotice(editingId ? "Media item updated." : "Media item published.");
    resetForm();
    await load();
  }

  async function onUpload(file: File, target: "media" | "thumbnail") {
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Maximum size is 10 MB.");
      return;
    }

    setError("");
    setNotice("");
    setUploadingField(target);

    try {
      const uploadedUrl = await uploadToCloudinary(file, `landing-${target}`);
      setForm((prev) => {
        if (target === "media") {
          const shouldUseAsThumb = prev.type === "image" && !prev.thumbnailUrl;
          return {
            ...prev,
            mediaUrl: uploadedUrl,
            thumbnailUrl: shouldUseAsThumb ? uploadedUrl : prev.thumbnailUrl
          };
        }

        return { ...prev, thumbnailUrl: uploadedUrl };
      });
      setNotice(target === "media" ? "Media uploaded. Save to publish changes." : "Thumbnail uploaded.");
    } catch (uploadError: any) {
      setError(String(uploadError?.message || "Upload failed."));
    } finally {
      setUploadingField(null);
    }
  }

  function startEdit(item: MediaItem) {
    setEditingId(item._id);
    setForm({
      title: item.title,
      type: item.type,
      mediaUrl: item.mediaUrl,
      thumbnailUrl: item.thumbnailUrl || "",
      linkUrl: item.linkUrl || "",
      placement: item.placement,
      order: item.order,
      isActive: item.isActive
    });
    setError("");
    setNotice(`Editing: ${item.title}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    if (editingId === item._id) resetForm();
    await load();
  }

  return (
    <div className="mt-6 space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <StatCard label="Total Media" value={String(summary.total)} />
        <StatCard label="Active" value={String(summary.active)} />
        {summary.byPlacement.map((entry) => (
          <StatCard key={entry.placement} label={`${entry.placement} items`} value={String(entry.total)} />
        ))}
      </section>

      <section className="glass-panel overflow-hidden">
        <div className="border-b border-white/10 bg-black/20 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.18em] text-pitch-200">Landing Composer</p>
          <h2 className="mt-1 text-2xl font-bold text-white">
            {editingId ? "Edit Landing Media" : "Publish New Landing Media"}
          </h2>
          <p className="mt-1 text-sm text-white/70">
            Upload from your device or paste public URLs. Media can be placed in hero, spotlight, reels, or ads.
          </p>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
          <label className="space-y-1">
            <span className="text-sm text-white/80">Title</span>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              required
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm text-white/80">Placement</span>
            <select
              className="input"
              value={form.placement}
              onChange={(e) => setForm((prev) => ({ ...prev, placement: e.target.value as Placement }))}
            >
              {placements.map((placement) => (
                <option key={placement.value} value={placement.value}>
                  {placement.label} - {placement.helper}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-white/80">Type</span>
            <select
              className="input"
              value={form.type}
              onChange={(e) => setForm((prev) => ({ ...prev, type: e.target.value as "image" | "video" }))}
            >
              <option value="image">Image</option>
              <option value="video">Video</option>
            </select>
          </label>

          <label className="space-y-1">
            <span className="text-sm text-white/80">Order</span>
            <input
              className="input"
              type="number"
              min={0}
              max={999}
              value={form.order}
              onChange={(e) => setForm((prev) => ({ ...prev, order: Number(e.target.value) || 0 }))}
            />
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-white/80">Media URL</span>
            <input
              className="input"
              value={form.mediaUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, mediaUrl: e.target.value }))}
              placeholder="https://..."
              required
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm text-white/80">Upload Media File (max 10 MB)</span>
            <input
              className="input"
              type="file"
              accept={form.type === "image" ? "image/*" : "video/*"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file, "media");
                e.currentTarget.value = "";
              }}
            />
            <p className="text-xs text-white/60">
              {uploadingField === "media" ? "Uploading media..." : "Use this to replace media quickly without leaving dashboard."}
            </p>
          </label>

          <label className="space-y-2">
            <span className="text-sm text-white/80">Thumbnail URL (optional)</span>
            <input
              className="input"
              value={form.thumbnailUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
              placeholder="https://..."
            />
            <input
              className="input"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file, "thumbnail");
                e.currentTarget.value = "";
              }}
            />
            <p className="text-xs text-white/60">{uploadingField === "thumbnail" ? "Uploading thumbnail..." : "Optional preview image for video cards."}</p>
          </label>

          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-white/80">Link URL (optional)</span>
            <input
              className="input"
              value={form.linkUrl}
              onChange={(e) => setForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
              placeholder="https://..."
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-white/85">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
            />
            Publish as active
          </label>

          <div className="flex flex-wrap gap-2 md:col-span-2">
            <button className="btn-primary" disabled={saving || uploadingField !== null}>
              {saving ? "Saving..." : editingId ? "Save Changes" : "Publish Media"}
            </button>
            {editingId ? (
              <button type="button" className="btn-muted" onClick={resetForm}>
                Cancel Edit
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {notice ? <p className="text-sm text-pitch-200">{notice}</p> : null}

      <section className="glass-panel p-5 md:p-6">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <input
            className="input max-w-md"
            placeholder="Search by title or URL"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`rounded-full px-3 py-1.5 text-sm ${placementFilter === "all" ? "bg-pitch-400 text-black" : "bg-white/10 text-white"}`}
              onClick={() => setPlacementFilter("all")}
            >
              All
            </button>
            {placements.map((placement) => (
              <button
                key={placement.value}
                type="button"
                className={`rounded-full px-3 py-1.5 text-sm ${placementFilter === placement.value ? "bg-pitch-400 text-black" : "bg-white/10 text-white"}`}
                onClick={() => setPlacementFilter(placement.value)}
              >
                {placement.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? <p className="text-white/70">Loading media items...</p> : null}
        {!loading && filteredItems.length === 0 ? <p className="text-white/70">No media items match this filter.</p> : null}

        <div className="space-y-6">
          {groupedItems.map((group) => (
            <div key={group.value}>
              {group.items.length ? (
                <>
                  <h3 className="mb-3 text-xs uppercase tracking-[0.18em] text-pitch-200">{group.label} Section</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {group.items.map((item) => (
                      <article key={item._id} className="glass-soft overflow-hidden p-0">
                        <MediaPreview item={item} />
                        <div className="space-y-2 p-4">
                          <p className="font-semibold text-white">{item.title}</p>
                          <p className="text-xs text-white/70">
                            {item.type.toUpperCase()} | order {item.order} | {item.isActive ? "active" : "inactive"}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <button type="button" className="btn-muted" onClick={() => startEdit(item)}>
                              Edit / Replace
                            </button>
                            <button type="button" className="btn-muted" onClick={() => toggleActive(item)}>
                              {item.isActive ? "Disable" : "Enable"}
                            </button>
                            <button type="button" className="btn-muted" onClick={() => remove(item)}>
                              Delete
                            </button>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-white/70">{label}</p>
      <p className="mt-1 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function MediaPreview({ item }: { item: MediaItem }) {
  if (item.type === "image") {
    return <img src={item.mediaUrl} alt={item.title} className="h-44 w-full object-cover" />;
  }

  if (isVideoFile(item.mediaUrl)) {
    return <video src={item.mediaUrl} controls className="h-44 w-full object-cover" />;
  }

  return (
    <iframe
      src={toEmbedUrl(item.mediaUrl)}
      className="h-44 w-full"
      title={item.title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
    />
  );
}
