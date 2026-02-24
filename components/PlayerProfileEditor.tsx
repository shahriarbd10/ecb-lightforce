"use client";

import { FormEvent, useEffect, useState } from "react";
import PhotoUploader from "@/components/PhotoUploader";

type AchievementItem = {
  title: string;
  details?: string;
  date?: string;
  image?: string;
};

type Profile = {
  slug?: string;
  age?: number;
  foot?: "left" | "right" | "both";
  bio?: string;
  availableNow?: boolean;
  availableTime?: string;
  offDays?: string[];
  profilePhoto?: string;
  photos?: string[];
  headline?: string;
  location?: string;
  positions?: string[];
  stats?: {
    matches?: number;
    goals?: number;
    assists?: number;
    cleanSheets?: number;
  };
  achievements?: AchievementItem[];
};

const positionOptions = ["GK", "CB", "LB", "RB", "DM", "CM", "AM", "LW", "RW", "ST"];
const offDayOptions = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

export default function PlayerProfileEditor({ userName, role }: { userName: string; role: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState<Profile>({
    slug: "",
    age: 0,
    foot: "right",
    bio: "",
    availableNow: false,
    availableTime: "",
    offDays: [],
    profilePhoto: "",
    photos: [],
    headline: "",
    location: "",
    positions: [],
    stats: { matches: 0, goals: 0, assists: 0, cleanSheets: 0 },
    achievements: []
  });
  const [achievementUploadIndex, setAchievementUploadIndex] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/player/profile", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || "Could not load profile.");
        setLoading(false);
        return;
      }
      setForm({
        slug: data.slug || "",
        age: data.age || 0,
        foot: data.foot || "right",
        bio: data.bio || "",
        availableNow: !!data.availableNow,
        availableTime: data.availableTime || "",
        offDays: data.offDays || [],
        profilePhoto: data.profilePhoto || (data.photos || [])[0] || "",
        photos: data.photos || [],
        headline: data.headline || "",
        location: data.location || "",
        positions: data.positions || [],
        stats: {
          matches: data.stats?.matches || 0,
          goals: data.stats?.goals || 0,
          assists: data.stats?.assists || 0,
          cleanSheets: data.stats?.cleanSheets || 0
        },
        achievements: (data.achievements || []).map((a: any) => ({
          title: a.title || "",
          details: a.details || "",
          date: a.date ? String(a.date).slice(0, 10) : "",
          image: a.image || ""
        }))
      });
      setLoading(false);
    }
    load();
  }, []);

  async function uploadAchievementImage(file: File, index: number) {
    if (file.size > 10 * 1024 * 1024) {
      setError("Achievement image must be 10 MB or less.");
      return;
    }

    setError("");
    setAchievementUploadIndex(index);
    try {
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "ecb-lightforce/achievements", purpose: "achievement" })
      });
      if (!signRes.ok) throw new Error("Could not get upload signature.");
      const signData = await signRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signData.apiKey);
      formData.append("timestamp", String(signData.timestamp));
      formData.append("folder", signData.folder);
      formData.append("public_id", signData.publicId);
      formData.append("signature", signData.signature);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
        method: "POST",
        body: formData
      });
      const uploaded = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploaded?.secure_url) {
        throw new Error(uploaded?.error?.message || "Achievement image upload failed.");
      }

      setForm((s) => ({
        ...s,
        achievements: (s.achievements || []).map((item, i) =>
          i === index ? { ...item, image: String(uploaded.secure_url) } : item
        )
      }));
    } catch (e: any) {
      setError(e?.message || "Could not upload achievement image.");
    } finally {
      setAchievementUploadIndex(null);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    const res = await fetch("/api/player/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      setMessage("Profile updated successfully.");
    } else {
      setError(data?.message || "Could not save.");
    }
  }

  if (loading) {
    return <p className="mt-6 text-white/70">Loading dashboard...</p>;
  }

  const storedPhotos = Array.from(new Set([...(form.photos || []), ...(form.profilePhoto ? [form.profilePhoto] : [])]));

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Match Readiness" value={form.availableNow ? "Available" : "Not Available"} />
        <StatCard label="Matches Played" value={String(form.stats?.matches || 0)} />
        <StatCard label="Goal Contributions" value={String((form.stats?.goals || 0) + (form.stats?.assists || 0))} />
        <StatCard label="Achievements" value={String(form.achievements?.length || 0)} />
      </section>

      <section className="glass-panel p-5 md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-pitch-200">Player Identity</p>
            <h2 className="mt-1 text-2xl font-bold text-white">{userName}</h2>
            <p className="text-sm text-white/70">Role: {role} · Public Slug: {form.slug || "pending"}</p>
          </div>
          {form.slug ? (
            <a href={`/players/${form.slug}`} className="btn-muted text-sm">
              View Public Profile
            </a>
          ) : null}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-white/80">Headline</span>
            <input
              className="input"
              value={form.headline || ""}
              onChange={(e) => setForm((s) => ({ ...s, headline: e.target.value }))}
              placeholder="Football & Futsal Midfielder"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-white/80">Location</span>
            <input
              className="input"
              value={form.location || ""}
              onChange={(e) => setForm((s) => ({ ...s, location: e.target.value }))}
              placeholder="Dhaka, Bangladesh"
            />
          </label>
        </div>

        <label className="mt-4 block space-y-1">
          <span className="text-sm text-white/80">Bio</span>
          <textarea
            className="input min-h-28"
            value={form.bio || ""}
            onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value }))}
            placeholder="Your playing style, strengths, recent form..."
          />
        </label>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
        <div className="glass-panel p-5 md:p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-pitch-200">Availability Engine</p>
          <h3 className="mt-1 text-xl font-semibold text-white">Match Window & Off Days</h3>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm text-white/80">Available Time</span>
              <input
                className="input"
                value={form.availableTime || ""}
                onChange={(e) => setForm((s) => ({ ...s, availableTime: e.target.value }))}
                placeholder="After 6:30 PM"
              />
            </label>
            <label className="inline-flex items-center gap-2 pt-7 text-sm text-white/85">
              <input
                type="checkbox"
                checked={!!form.availableNow}
                onChange={(e) => setForm((s) => ({ ...s, availableNow: e.target.checked }))}
              />
              Available now for a match
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {offDayOptions.map((day) => {
              const active = (form.offDays || []).includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() =>
                    setForm((s) => ({
                      ...s,
                      offDays: active ? (s.offDays || []).filter((d) => d !== day) : [...(s.offDays || []), day]
                    }))
                  }
                  className={active ? "btn-primary" : "btn-muted"}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        <div className="glass-panel p-5 md:p-6">
          <p className="text-xs uppercase tracking-[0.16em] text-pitch-200">Tactical Profile</p>
          <h3 className="mt-1 text-xl font-semibold text-white">Preferred Positions</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {positionOptions.map((position) => {
              const active = (form.positions || []).includes(position);
              return (
                <button
                  type="button"
                  key={position}
                  onClick={() =>
                    setForm((s) => ({
                      ...s,
                      positions: active ? (s.positions || []).filter((p) => p !== position) : [...(s.positions || []), position]
                    }))
                  }
                  className={active ? "btn-primary" : "btn-muted"}
                >
                  {position}
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-sm text-white/70">Profile: Age {form.age || "-"} · Preferred foot {form.foot || "-"}</p>
        </div>
      </section>

      <section className="glass-panel p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-pitch-200">Performance Metrics</p>
        <h3 className="mt-1 text-xl font-semibold text-white">Update Season Stats</h3>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <NumberInput
            label="Matches"
            value={form.stats?.matches || 0}
            onChange={(value) =>
              setForm((s) => ({ ...s, stats: { ...(s.stats || {}), matches: value } }))
            }
          />
          <NumberInput
            label="Goals"
            value={form.stats?.goals || 0}
            onChange={(value) => setForm((s) => ({ ...s, stats: { ...(s.stats || {}), goals: value } }))}
          />
          <NumberInput
            label="Assists"
            value={form.stats?.assists || 0}
            onChange={(value) => setForm((s) => ({ ...s, stats: { ...(s.stats || {}), assists: value } }))}
          />
          <NumberInput
            label="Clean Sheets"
            value={form.stats?.cleanSheets || 0}
            onChange={(value) => setForm((s) => ({ ...s, stats: { ...(s.stats || {}), cleanSheets: value } }))}
          />
        </div>
      </section>

      <section className="glass-panel p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-pitch-200">Achievements</p>
            <h3 className="mt-1 text-xl font-semibold text-white">Career Highlights</h3>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              setForm((s) => ({
                ...s,
                achievements: [...(s.achievements || []), { title: "", details: "", date: "", image: "" }]
              }))
            }
          >
            Add Achievement
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {(form.achievements || []).length === 0 ? (
            <p className="text-sm text-white/70">No achievements added yet.</p>
          ) : (
            (form.achievements || []).map((achievement, idx) => (
              <div key={`achievement-${idx}`} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-medium text-white">Achievement {idx + 1}</p>
                  <button
                    type="button"
                    className="text-xs text-red-300 underline"
                    onClick={() =>
                      setForm((s) => ({
                        ...s,
                        achievements: (s.achievements || []).filter((_, i) => i !== idx)
                      }))
                    }
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-sm text-white/80">Title</span>
                    <input
                      className="input"
                      value={achievement.title || ""}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          achievements: (s.achievements || []).map((item, i) =>
                            i === idx ? { ...item, title: e.target.value } : item
                          )
                        }))
                      }
                      placeholder="Inter University Cup Winner"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-sm text-white/80">Date</span>
                    <input
                      className="input"
                      type="date"
                      value={achievement.date || ""}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          achievements: (s.achievements || []).map((item, i) =>
                            i === idx ? { ...item, date: e.target.value } : item
                          )
                        }))
                      }
                    />
                  </label>
                </div>

                <label className="mt-3 block space-y-1">
                  <span className="text-sm text-white/80">Details</span>
                  <textarea
                    className="input min-h-20"
                    value={achievement.details || ""}
                    onChange={(e) =>
                      setForm((s) => ({
                        ...s,
                        achievements: (s.achievements || []).map((item, i) =>
                          i === idx ? { ...item, details: e.target.value } : item
                        )
                      }))
                    }
                    placeholder="Tournament, contribution, role, impact..."
                  />
                </label>

                <div className="mt-3 grid gap-3 md:grid-cols-[1fr_160px]">
                  <div className="space-y-1">
                    <span className="text-sm text-white/80">Achievement Image URL</span>
                    <input
                      className="input"
                      value={achievement.image || ""}
                      onChange={(e) =>
                        setForm((s) => ({
                          ...s,
                          achievements: (s.achievements || []).map((item, i) =>
                            i === idx ? { ...item, image: e.target.value } : item
                          )
                        }))
                      }
                      placeholder="https://..."
                    />
                    <input
                      type="file"
                      accept="image/*"
                      className="input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadAchievementImage(file, idx);
                        e.currentTarget.value = "";
                      }}
                    />
                    <p className="text-xs text-white/60">
                      {achievementUploadIndex === idx ? "Uploading image..." : "Recommended: 1200x800, max 10 MB."}
                    </p>
                  </div>

                  <div>
                    {achievement.image ? (
                      <img src={achievement.image} alt={`Achievement ${idx + 1}`} className="h-32 w-full rounded-lg border border-white/15 object-cover" />
                    ) : (
                      <div className="flex h-32 w-full items-center justify-center rounded-lg border border-white/15 text-xs text-white/55">
                        No image
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="glass-panel p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-pitch-200">Media</p>
        <h3 className="mt-1 text-xl font-semibold text-white">Profile Photo</h3>
        <div className="mt-4">
          <PhotoUploader
            value={form.photos || []}
            onChange={(urls) =>
              setForm((s) => {
                const previousPhotos = s.photos || [];
                const previousProfile = s.profilePhoto || "";
                const newUrls = urls.filter((u) => !previousPhotos.includes(u));
                const isUpload = newUrls.length > 0;

                if (isUpload) {
                  const latestUploaded = newUrls[newUrls.length - 1] || "";
                  return {
                    ...s,
                    photos: urls,
                    profilePhoto: latestUploaded || (urls.includes(previousProfile) ? previousProfile : urls[0] || "")
                  };
                }

                const nextProfile = urls.includes(previousProfile) ? previousProfile : urls[0] || "";
                return {
                  ...s,
                  photos: urls,
                  profilePhoto: nextProfile
                };
              })
            }
            maxFiles={10}
          />
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[120px_1fr]">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-white/60">Current Avatar</p>
            {form.profilePhoto ? (
              <img
                src={form.profilePhoto}
                alt="Primary profile"
                className="mt-2 h-24 w-24 rounded-xl border border-white/15 object-cover"
              />
            ) : (
              <div className="mt-2 flex h-24 w-24 items-center justify-center rounded-xl border border-white/15 text-xs text-white/50">
                No photo
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-sm text-white/80">Select Active Photo (Preview)</span>
            {storedPhotos.length === 0 ? (
              <p className="text-xs text-white/55">Upload a photo first.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 md:grid-cols-5">
                {storedPhotos.map((url, idx) => {
                  const active = form.profilePhoto === url;
                  return (
                    <button
                      key={`${url}-${idx}`}
                      type="button"
                      onClick={() => setForm((s) => ({ ...s, profilePhoto: url }))}
                      className={`overflow-hidden rounded-lg border ${active ? "border-pitch-300 ring-1 ring-pitch-300" : "border-white/15"}`}
                    >
                      <div className="aspect-square w-full bg-white/5">
                        <img src={url} alt={`Profile option ${idx + 1}`} className="h-full w-full object-cover" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {message ? <p className="text-sm text-pitch-300">{message}</p> : null}
      <button className="btn-primary" disabled={saving}>
        {saving ? "Saving Player Data..." : "Save Dashboard Updates"}
      </button>
    </form>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-soft p-4">
      <p className="text-xs uppercase tracking-[0.12em] text-white/60">{label}</p>
      <p className="mt-1 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="space-y-1">
      <span className="text-sm text-white/80">{label}</span>
      <input
        className="input"
        type="number"
        min={0}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
      />
    </label>
  );
}
