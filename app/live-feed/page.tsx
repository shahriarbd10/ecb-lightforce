"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

type FeedPost = {
  id: string;
  type: "achievement" | "match_update" | "general";
  title: string;
  content: string;
  image?: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  comments: { id: string; userId: string; authorName: string; text: string; createdAt: string }[];
  author: {
    name: string;
    slug: string;
    profilePhoto?: string;
    profilePhotoMeta?: { x?: number; y?: number; zoom?: number };
  };
};

export default function LiveFeedPage() {
  const { data: session, status } = useSession();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [composer, setComposer] = useState({
    type: "general" as "achievement" | "match_update" | "general",
    title: "",
    content: "",
    image: ""
  });
  const [saving, setSaving] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});

  const canPost = status === "authenticated" && session?.user?.role === "player";

  async function loadFeed() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/hub/posts", { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Could not load live feed.");
        setPosts([]);
      } else {
        setPosts(Array.isArray(data) ? data : []);
      }
    } catch {
      setError("Network error while loading live feed.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeed();
  }, []);

  async function uploadImage(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be 10 MB or less.");
      return;
    }
    const signRes = await fetch("/api/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: "ecb-lightforce/hub-posts", purpose: "hub-post" })
    });
    const signData = await signRes.json().catch(() => ({}));
    if (!signRes.ok) throw new Error(signData?.message || "Could not get upload signature.");

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
      throw new Error(uploaded?.error?.message || "Image upload failed.");
    }
    setComposer((s) => ({ ...s, image: String(uploaded.secure_url) }));
  }

  async function publishPost() {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/hub/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(composer)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.message || "Could not publish.");
        return;
      }
      setComposer({ type: "general", title: "", content: "", image: "" });
      await loadFeed();
    } finally {
      setSaving(false);
    }
  }

  async function toggleLike(postId: string) {
    const res = await fetch(`/api/hub/posts/${postId}/like`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return;
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likeCount: data.likeCount, likedByMe: Boolean(data.likedByMe) } : p))
    );
  }

  async function addComment(postId: string) {
    const text = (commentText[postId] || "").trim();
    if (!text) return;
    const res = await fetch(`/api/hub/posts/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.message || "Could not add comment.");
      return;
    }
    setCommentText((prev) => ({ ...prev, [postId]: "" }));
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, commentCount: data.commentCount, comments: [...(p.comments || []), data.comment] }
          : p
      )
    );
  }

  return (
    <main className="container-page">
      <section className="glass-panel p-5 md:p-6">
        <p className="text-xs uppercase tracking-[0.16em] text-pitch-200">Live Feed</p>
        <h1 className="font-display mt-1 text-4xl text-white md:text-5xl">Player Timeline</h1>
        <p className="mt-2 text-sm text-white/75">Facebook-style updates from all players with likes and comments.</p>
      </section>

      {canPost ? (
        <section className="glass-panel mt-4 p-5 md:p-6">
          <p className="text-sm font-semibold text-white">Create Post</p>
          <div className="mt-3 space-y-2">
            <select className="input" value={composer.type} onChange={(e) => setComposer((s) => ({ ...s, type: e.target.value as any }))}>
              <option value="general">General</option>
              <option value="achievement">Achievement</option>
              <option value="match_update">Match Update</option>
            </select>
            <input className="input" placeholder="Title" value={composer.title} onChange={(e) => setComposer((s) => ({ ...s, title: e.target.value }))} />
            <textarea className="input min-h-28" placeholder="Share your update..." value={composer.content} onChange={(e) => setComposer((s) => ({ ...s, content: e.target.value }))} />
            <input
              type="file"
              className="input"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  await uploadImage(file);
                } catch (err: any) {
                  setError(String(err?.message || "Could not upload image."));
                } finally {
                  e.currentTarget.value = "";
                }
              }}
            />
            {composer.image ? <img src={composer.image} alt="Preview" className="h-48 w-full rounded-xl border border-white/10 object-cover" /> : null}
            <button className="btn-primary" onClick={publishPost} disabled={saving || !composer.title || !composer.content}>
              {saving ? "Publishing..." : "Publish"}
            </button>
          </div>
        </section>
      ) : (
        <section className="glass-panel mt-4 p-4 text-sm text-white/75">
          Login as player to publish updates. <Link href="/login?callbackUrl=/live-feed" className="underline text-pitch-200">Login</Link>
        </section>
      )}

      <section className="mt-4 space-y-4">
        {loading ? <p className="text-white/75">Loading live feed...</p> : null}
        {!loading && error ? <p className="text-red-300">{error}</p> : null}
        {!loading && !posts.length ? <p className="text-white/75">No posts yet.</p> : null}

        {posts.map((post) => (
          <article key={post.id} className="glass-panel p-4 md:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {post.author.profilePhoto ? (
                  <img src={post.author.profilePhoto} alt={post.author.name} className="h-10 w-10 rounded-full object-cover" style={avatarStyle(post.author.profilePhotoMeta)} />
                ) : (
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-pitch-300 font-semibold text-black">{post.author.name.slice(0, 1).toUpperCase()}</span>
                )}
                <div>
                  <p className="text-sm font-semibold text-white">{post.author.name}</p>
                  <p className="text-xs text-white/65">{formatDateTime(post.createdAt)}</p>
                </div>
              </div>
              <span className="rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[11px] uppercase tracking-[0.12em] text-pitch-200">{post.type.replace("_", " ")}</span>
            </div>

            <h2 className="mt-3 text-lg font-semibold text-white">{post.title}</h2>
            <p className="mt-1 whitespace-pre-wrap text-sm text-white/85">{post.content}</p>
            {post.image ? <img src={post.image} alt={post.title} className="mt-3 h-[320px] w-full rounded-xl border border-white/10 object-cover" /> : null}

            <div className="mt-3 flex items-center gap-4 border-y border-white/10 py-2 text-sm">
              <button className={`rounded-full px-3 py-1 ${post.likedByMe ? "bg-pitch-300/20 text-pitch-200" : "bg-white/5 text-white/80"}`} onClick={() => toggleLike(post.id)}>
                Like ({post.likeCount})
              </button>
              <span className="text-white/70">Comments ({post.commentCount})</span>
              {post.author.slug ? <Link href={`/players/${post.author.slug}`} className="text-pitch-200 underline">Profile</Link> : null}
            </div>

            <div className="mt-3 space-y-2">
              {(post.comments || []).map((comment) => (
                <div key={comment.id} className="rounded-lg border border-white/10 bg-white/5 p-2.5">
                  <p className="text-xs font-semibold text-white">{comment.authorName}</p>
                  <p className="text-sm text-white/85">{comment.text}</p>
                </div>
              ))}
            </div>

            {status === "authenticated" ? (
              <div className="mt-2 flex gap-2">
                <input
                  className="input"
                  placeholder="Write a comment..."
                  value={commentText[post.id] || ""}
                  onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                />
                <button className="btn-muted" onClick={() => addComment(post.id)}>
                  Comment
                </button>
              </div>
            ) : null}
          </article>
        ))}
      </section>
    </main>
  );
}

function avatarStyle(meta?: { x?: number; y?: number; zoom?: number }) {
  const x = meta?.x ?? 50;
  const y = meta?.y ?? 50;
  const zoom = meta?.zoom ?? 1;
  return { objectPosition: `${x}% ${y}%`, transform: `scale(${zoom})` };
}

function formatDateTime(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

