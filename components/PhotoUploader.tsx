"use client";

import { useState } from "react";

type Props = {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
};

type SignResponse = {
  cloudName: string;
  apiKey: string;
  timestamp: string;
  folder: string;
  publicId: string;
  signature: string;
};

export default function PhotoUploader({ value, onChange, maxFiles = 6 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const maxBytes = 10 * 1024 * 1024;

  async function uploadOne(file: File) {
    const signRes = await fetch("/api/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "ecb-lightforce/players", purpose: "gallery" })
    });

    if (!signRes.ok) throw new Error("Could not get upload signature.");
    const signData: SignResponse = await signRes.json();

    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", signData.apiKey);
    formData.append("timestamp", signData.timestamp);
    formData.append("folder", signData.folder);
    formData.append("public_id", signData.publicId);
    formData.append("signature", signData.signature);

    const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
      method: "POST",
      body: formData
    });

    if (!uploadRes.ok) throw new Error("Cloudinary upload failed.");
    const uploaded = await uploadRes.json();
    return String(uploaded.secure_url || "");
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;

    const remaining = maxFiles - value.length;
    const candidates = Array.from(files).slice(0, remaining);
    const oversized = candidates.filter((f) => f.size > maxBytes);
    const selected = candidates.filter((f) => f.size <= maxBytes);

    if (oversized.length) {
      setError(`Some files exceeded 10 MB and were skipped: ${oversized.map((f) => f.name).join(", ")}`);
    }
    if (!selected.length) return;

    setUploading(true);
    if (!oversized.length) setError("");

    try {
      const urls: string[] = [];
      for (const file of selected) {
        const url = await uploadOne(file);
        if (url) urls.push(url);
      }
      onChange([...value, ...urls]);
    } catch (err: any) {
      setError(err?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm text-white/80">Photos</label>
      <input
        className="input"
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        disabled={uploading || value.length >= maxFiles}
      />
      <p className="text-xs text-white/60">{uploading ? "Uploading..." : `${value.length}/${maxFiles} uploaded`}</p>
      <p className="text-xs text-white/55">
        Profile photo guide: use 1080x1080 px (square) or 1200x1600 px (portrait). Maximum file size: 10 MB.
      </p>
      {error ? <p className="text-xs text-red-300">{error}</p> : null}

      {value.length > 0 ? (
        <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
          {value.map((url, idx) => (
            <div key={`${url}-${idx}`} className="relative overflow-hidden rounded-lg border border-white/15">
              <img src={url} alt={`Upload ${idx + 1}`} className="h-20 w-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(idx)}
                className="absolute right-1 top-1 rounded bg-black/70 px-2 py-0.5 text-xs text-white"
              >
                x
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
