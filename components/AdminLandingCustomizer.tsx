"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { defaultLandingConfig, type LandingConfig } from "@/lib/landing-config";
import LandingSections from "@/components/LandingSections";

export default function AdminLandingCustomizer() {
  const [config, setConfig] = useState<LandingConfig>(defaultLandingConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showLivePreview, setShowLivePreview] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/landing-config", { cache: "no-store" });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      setError((data as any)?.message || "Could not load landing settings.");
      setConfig(defaultLandingConfig);
    } else {
      setConfig(data as LandingConfig);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");

    const res = await fetch("/api/admin/landing-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config)
    });
    const data = await res.json().catch(() => null);
    setSaving(false);

    if (!res.ok || !data) {
      setError((data as any)?.message || "Could not save landing settings.");
      return;
    }

    setConfig(data as LandingConfig);
    setNotice("Landing settings updated successfully.");
  }

  const enabledCount = useMemo(() => {
    const s = config.sections;
    return [s.showPulse, s.showVideoZone, s.showSpotlight, s.showReels, s.showAds].filter(Boolean).length;
  }, [config.sections]);

  const unsavedPreviewFeed = useMemo(() => {
    const highlights = config.feed.highlights
      .filter((item) => item.isActive)
      .map((item) => ({
        id: item.id,
        title: item.title || "Highlight",
        league: item.league || "ECB Lightforce",
        date: item.date || "",
        time: item.time || "",
        thumb: item.thumb || "",
        video: item.video || ""
      }));

    const fixtures = config.feed.fixtures
      .filter((item) => item.isActive)
      .map((item) => ({
        id: item.id,
        event: item.event || "Fixture",
        league: item.league || "Football",
        date: item.date || "",
        time: item.time || ""
      }));

    const manualVideoZone = config.feed.videoZone
      .filter((item) => item.isActive)
      .map((item) => ({
        id: item.id,
        title: item.title || "Video",
        league: item.league || "ECB Lightforce",
        date: "",
        time: "",
        thumb: item.thumb || "",
        video: item.video || ""
      }));

    return {
      source: "preview",
      config,
      highlights,
      fixtures,
      manualVideoZone
    };
  }, [config]);

  function newId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  function toIso(value: string) {
    if (!value) return "";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString();
  }

  function isoToLocalInput(value?: string) {
    if (!value) return "";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  }

  return (
    <section className="glass-panel overflow-hidden">
      <div className="border-b border-white/10 bg-black/20 px-5 py-4">
        <p className="text-xs uppercase tracking-[0.18em] text-pitch-200">Landing Control</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Full Landing Page Customizer</h2>
        <p className="mt-1 text-sm text-white/70">
          Manage hero copy, section labels, and visibility toggles. Preview updates instantly before publishing.
        </p>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1.1fr_1fr] lg:p-6">
        <form onSubmit={onSave} className="space-y-5">
          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-white">Hero Content</legend>
            <input
              className="input"
              placeholder="Hero badge"
              value={config.hero.badge}
              onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, badge: e.target.value } }))}
            />
            <input
              className="input"
              placeholder="Title line 1"
              value={config.hero.titleLine1}
              onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, titleLine1: e.target.value } }))}
            />
            <input
              className="input"
              placeholder="Title line 2"
              value={config.hero.titleLine2}
              onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, titleLine2: e.target.value } }))}
            />
            <textarea
              className="input min-h-24"
              placeholder="Hero description"
              value={config.hero.description}
              onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, description: e.target.value } }))}
            />
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="input"
                placeholder="Primary CTA label"
                value={config.hero.primaryCtaLabel}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, hero: { ...prev.hero, primaryCtaLabel: e.target.value } }))
                }
              />
              <input
                className="input"
                placeholder="Primary CTA link"
                value={config.hero.primaryCtaHref}
                onChange={(e) => setConfig((prev) => ({ ...prev, hero: { ...prev.hero, primaryCtaHref: e.target.value } }))}
              />
              <input
                className="input"
                placeholder="Secondary CTA label"
                value={config.hero.secondaryCtaLabel}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, hero: { ...prev.hero, secondaryCtaLabel: e.target.value } }))
                }
              />
              <input
                className="input"
                placeholder="Secondary CTA link"
                value={config.hero.secondaryCtaHref}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, hero: { ...prev.hero, secondaryCtaHref: e.target.value } }))
                }
              />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-white">Section Labels</legend>
            <div className="grid gap-3 md:grid-cols-2">
              <input
                className="input"
                placeholder="Pulse eyebrow"
                value={config.labels.pulseEyebrow}
                onChange={(e) => setConfig((prev) => ({ ...prev, labels: { ...prev.labels, pulseEyebrow: e.target.value } }))}
              />
              <input
                className="input"
                placeholder="Pulse title"
                value={config.labels.pulseTitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, labels: { ...prev.labels, pulseTitle: e.target.value } }))}
              />
              <input
                className="input"
                placeholder="Video eyebrow"
                value={config.labels.videoEyebrow}
                onChange={(e) => setConfig((prev) => ({ ...prev, labels: { ...prev.labels, videoEyebrow: e.target.value } }))}
              />
              <input
                className="input"
                placeholder="Video title"
                value={config.labels.videoTitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, labels: { ...prev.labels, videoTitle: e.target.value } }))}
              />
              <input
                className="input"
                placeholder="Spotlight eyebrow"
                value={config.labels.spotlightEyebrow}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, labels: { ...prev.labels, spotlightEyebrow: e.target.value } }))
                }
              />
              <input
                className="input"
                placeholder="Spotlight title"
                value={config.labels.spotlightTitle}
                onChange={(e) =>
                  setConfig((prev) => ({ ...prev, labels: { ...prev.labels, spotlightTitle: e.target.value } }))
                }
              />
              <input
                className="input"
                placeholder="Reels eyebrow"
                value={config.labels.reelsEyebrow}
                onChange={(e) => setConfig((prev) => ({ ...prev, labels: { ...prev.labels, reelsEyebrow: e.target.value } }))}
              />
              <input
                className="input"
                placeholder="Reels title"
                value={config.labels.reelsTitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, labels: { ...prev.labels, reelsTitle: e.target.value } }))}
              />
              <input
                className="input"
                placeholder="Ads eyebrow"
                value={config.labels.adsEyebrow}
                onChange={(e) => setConfig((prev) => ({ ...prev, labels: { ...prev.labels, adsEyebrow: e.target.value } }))}
              />
              <input
                className="input"
                placeholder="Ads title"
                value={config.labels.adsTitle}
                onChange={(e) => setConfig((prev) => ({ ...prev, labels: { ...prev.labels, adsTitle: e.target.value } }))}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-white">Visibility Toggles</legend>
            <div className="grid gap-2 text-sm text-white/85 md:grid-cols-2">
              <Toggle
                label="Latest Football Pulse"
                checked={config.sections.showPulse}
                onChange={(value) => setConfig((prev) => ({ ...prev, sections: { ...prev.sections, showPulse: value } }))}
              />
              <Toggle
                label="Video Zone"
                checked={config.sections.showVideoZone}
                onChange={(value) =>
                  setConfig((prev) => ({ ...prev, sections: { ...prev.sections, showVideoZone: value } }))
                }
              />
              <Toggle
                label="Spotlight Section"
                checked={config.sections.showSpotlight}
                onChange={(value) =>
                  setConfig((prev) => ({ ...prev, sections: { ...prev.sections, showSpotlight: value } }))
                }
              />
              <Toggle
                label="Reels Wall"
                checked={config.sections.showReels}
                onChange={(value) => setConfig((prev) => ({ ...prev, sections: { ...prev.sections, showReels: value } }))}
              />
              <Toggle
                label="Ads Section"
                checked={config.sections.showAds}
                onChange={(value) => setConfig((prev) => ({ ...prev, sections: { ...prev.sections, showAds: value } }))}
              />
            </div>
          </fieldset>

          <fieldset className="space-y-3">
            <legend className="text-sm font-semibold text-white">Pulse And Video Zone Data</legend>
            <Toggle
              label="Use Manual Feed (override API highlights/fixtures/videos)"
              checked={config.feed.useManualFeed}
              onChange={(value) => setConfig((prev) => ({ ...prev, feed: { ...prev.feed, useManualFeed: value } }))}
            />

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Manual Highlights</p>
                <button
                  type="button"
                  className="btn-muted"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      feed: {
                        ...prev.feed,
                        highlights: [
                          ...prev.feed.highlights,
                          {
                            id: newId("hl"),
                            title: "",
                            league: "",
                            date: "",
                            time: "",
                            thumb: "",
                            video: "",
                            isActive: true,
                            publishAt: ""
                          }
                        ]
                      }
                    }))
                  }
                >
                  Add Highlight
                </button>
              </div>
              <div className="space-y-3">
                {config.feed.highlights.map((item, idx) => (
                  <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs text-white/70">Highlight {idx + 1}</p>
                      <button
                        type="button"
                        className="text-xs text-red-300 underline"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: { ...prev.feed, highlights: prev.feed.highlights.filter((h) => h.id !== item.id) }
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        className="input"
                        placeholder="Title"
                        value={item.title}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              highlights: prev.feed.highlights.map((h) => (h.id === item.id ? { ...h, title: e.target.value } : h))
                            }
                          }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="League"
                        value={item.league}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              highlights: prev.feed.highlights.map((h) => (h.id === item.id ? { ...h, league: e.target.value } : h))
                            }
                          }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="Date (YYYY-MM-DD)"
                        value={item.date}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              highlights: prev.feed.highlights.map((h) => (h.id === item.id ? { ...h, date: e.target.value } : h))
                            }
                          }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="Time (HH:mm:ss)"
                        value={item.time}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              highlights: prev.feed.highlights.map((h) => (h.id === item.id ? { ...h, time: e.target.value } : h))
                            }
                          }))
                        }
                      />
                      <input
                        className="input md:col-span-2"
                        placeholder="Thumbnail URL"
                        value={item.thumb}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              highlights: prev.feed.highlights.map((h) => (h.id === item.id ? { ...h, thumb: e.target.value } : h))
                            }
                          }))
                        }
                      />
                      <input
                        className="input md:col-span-2"
                        placeholder="Video URL (optional)"
                        value={item.video}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              highlights: prev.feed.highlights.map((h) => (h.id === item.id ? { ...h, video: e.target.value } : h))
                            }
                          }))
                        }
                      />
                      <input
                        className="input"
                        type="datetime-local"
                        value={isoToLocalInput(item.publishAt)}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              highlights: prev.feed.highlights.map((h) =>
                                h.id === item.id ? { ...h, publishAt: toIso(e.target.value) } : h
                              )
                            }
                          }))
                        }
                      />
                      <label className="inline-flex items-center gap-2 text-sm text-white/85">
                        <input
                          type="checkbox"
                          checked={item.isActive}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              feed: {
                                ...prev.feed,
                                highlights: prev.feed.highlights.map((h) =>
                                  h.id === item.id ? { ...h, isActive: e.target.checked } : h
                                )
                              }
                            }))
                          }
                        />
                        Active
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Manual Fixtures</p>
                <button
                  type="button"
                  className="btn-muted"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      feed: {
                        ...prev.feed,
                        fixtures: [
                          ...prev.feed.fixtures,
                          { id: newId("fx"), event: "", league: "", date: "", time: "", isActive: true, publishAt: "" }
                        ]
                      }
                    }))
                  }
                >
                  Add Fixture
                </button>
              </div>
              <div className="space-y-3">
                {config.feed.fixtures.map((item, idx) => (
                  <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs text-white/70">Fixture {idx + 1}</p>
                      <button
                        type="button"
                        className="text-xs text-red-300 underline"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: { ...prev.feed, fixtures: prev.feed.fixtures.filter((f) => f.id !== item.id) }
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        className="input md:col-span-2"
                        placeholder="Match Event"
                        value={item.event}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              fixtures: prev.feed.fixtures.map((f) => (f.id === item.id ? { ...f, event: e.target.value } : f))
                            }
                          }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="League"
                        value={item.league}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              fixtures: prev.feed.fixtures.map((f) => (f.id === item.id ? { ...f, league: e.target.value } : f))
                            }
                          }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="Date (YYYY-MM-DD)"
                        value={item.date}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              fixtures: prev.feed.fixtures.map((f) => (f.id === item.id ? { ...f, date: e.target.value } : f))
                            }
                          }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="Time (HH:mm:ss)"
                        value={item.time}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              fixtures: prev.feed.fixtures.map((f) => (f.id === item.id ? { ...f, time: e.target.value } : f))
                            }
                          }))
                        }
                      />
                      <input
                        className="input"
                        type="datetime-local"
                        value={isoToLocalInput(item.publishAt)}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              fixtures: prev.feed.fixtures.map((f) =>
                                f.id === item.id ? { ...f, publishAt: toIso(e.target.value) } : f
                              )
                            }
                          }))
                        }
                      />
                      <label className="inline-flex items-center gap-2 text-sm text-white/85">
                        <input
                          type="checkbox"
                          checked={item.isActive}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              feed: {
                                ...prev.feed,
                                fixtures: prev.feed.fixtures.map((f) =>
                                  f.id === item.id ? { ...f, isActive: e.target.checked } : f
                                )
                              }
                            }))
                          }
                        />
                        Active
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Manual Video Zone</p>
                <button
                  type="button"
                  className="btn-muted"
                  onClick={() =>
                    setConfig((prev) => ({
                      ...prev,
                      feed: {
                        ...prev.feed,
                        videoZone: [
                          ...prev.feed.videoZone,
                          { id: newId("vz"), title: "", league: "", video: "", thumb: "", isActive: true, publishAt: "" }
                        ]
                      }
                    }))
                  }
                >
                  Add Video
                </button>
              </div>
              <div className="space-y-3">
                {config.feed.videoZone.map((item, idx) => (
                  <div key={item.id} className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs text-white/70">Video {idx + 1}</p>
                      <button
                        type="button"
                        className="text-xs text-red-300 underline"
                        onClick={() =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: { ...prev.feed, videoZone: prev.feed.videoZone.filter((v) => v.id !== item.id) }
                          }))
                        }
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-2">
                      <input
                        className="input"
                        placeholder="Title"
                        value={item.title}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              videoZone: prev.feed.videoZone.map((v) => (v.id === item.id ? { ...v, title: e.target.value } : v))
                            }
                          }))
                        }
                      />
                      <input
                        className="input"
                        placeholder="League"
                        value={item.league}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              videoZone: prev.feed.videoZone.map((v) => (v.id === item.id ? { ...v, league: e.target.value } : v))
                            }
                          }))
                        }
                      />
                      <input
                        className="input md:col-span-2"
                        placeholder="Video URL"
                        value={item.video}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              videoZone: prev.feed.videoZone.map((v) => (v.id === item.id ? { ...v, video: e.target.value } : v))
                            }
                          }))
                        }
                      />
                      <input
                        className="input md:col-span-2"
                        placeholder="Thumbnail URL (optional)"
                        value={item.thumb || ""}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              videoZone: prev.feed.videoZone.map((v) => (v.id === item.id ? { ...v, thumb: e.target.value } : v))
                            }
                          }))
                        }
                      />
                      <input
                        className="input"
                        type="datetime-local"
                        value={isoToLocalInput(item.publishAt)}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            feed: {
                              ...prev.feed,
                              videoZone: prev.feed.videoZone.map((v) =>
                                v.id === item.id ? { ...v, publishAt: toIso(e.target.value) } : v
                              )
                            }
                          }))
                        }
                      />
                      <label className="inline-flex items-center gap-2 text-sm text-white/85">
                        <input
                          type="checkbox"
                          checked={item.isActive}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              feed: {
                                ...prev.feed,
                                videoZone: prev.feed.videoZone.map((v) =>
                                  v.id === item.id ? { ...v, isActive: e.target.checked } : v
                                )
                              }
                            }))
                          }
                        />
                        Active
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <button className="btn-primary" disabled={loading || saving}>
              {saving ? "Saving..." : "Save Landing Settings"}
            </button>
            <button type="button" className="btn-muted" onClick={load} disabled={loading || saving}>
              {loading ? "Loading..." : "Reload"}
            </button>
            <button type="button" className="btn-muted" onClick={() => setShowLivePreview((v) => !v)}>
              {showLivePreview ? "Hide Unsaved Preview" : "Preview Unsaved Landing"}
            </button>
          </div>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          {notice ? <p className="text-sm text-pitch-200">{notice}</p> : null}
        </form>

        <div className="glass-soft p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-pitch-200">Preview</p>
          <h3 className="mt-2 text-xl font-semibold text-white">Landing Snapshot</h3>
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-pitch-200">{config.hero.badge}</p>
              <p className="mt-2 text-2xl font-bold text-white">{config.hero.titleLine1}</p>
              <p className="text-2xl font-bold text-pitch-300">{config.hero.titleLine2}</p>
              <p className="mt-2 text-sm text-white/70">{config.hero.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-pitch-400 px-3 py-1 font-semibold text-black">{config.hero.primaryCtaLabel}</span>
                <span className="rounded-full border border-white/20 px-3 py-1 text-white">{config.hero.secondaryCtaLabel}</span>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-xs uppercase tracking-[0.14em] text-white/70">Visible Content Blocks</p>
              <p className="mt-1 text-sm text-white">{enabledCount}/5 sections enabled</p>
              <div className="mt-3 grid gap-2 text-xs">
                <PreviewTag label={config.labels.pulseTitle} enabled={config.sections.showPulse} />
                <PreviewTag label={config.labels.videoTitle} enabled={config.sections.showVideoZone} />
                <PreviewTag label={config.labels.spotlightTitle} enabled={config.sections.showSpotlight} />
                <PreviewTag label={config.labels.reelsTitle} enabled={config.sections.showReels} />
                <PreviewTag label={config.labels.adsTitle} enabled={config.sections.showAds} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showLivePreview ? (
        <div className="border-t border-white/10 bg-black/25 p-4 md:p-6">
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-pitch-200">Unsaved Live Preview</p>
          <div className="max-h-[75vh] overflow-y-auto rounded-2xl border border-white/10">
            <LandingSections previewData={unsavedPreviewFeed} previewMode />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

function PreviewTag({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <div className={`rounded-lg border px-3 py-2 ${enabled ? "border-pitch-300/60 bg-pitch-300/10 text-pitch-100" : "border-white/10 bg-white/5 text-white/50"}`}>
      {enabled ? "Enabled" : "Hidden"}: {label}
    </div>
  );
}
