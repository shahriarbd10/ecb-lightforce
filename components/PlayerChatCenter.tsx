"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type PlayerSummary = {
  userId: string;
  name: string;
  slug: string;
  location: string;
  headline: string;
  profilePhoto: string;
  profilePhotoMeta?: { x: number; y: number; zoom: number };
  requestStatus?: "none" | "pending" | "accepted" | "rejected";
  requestDirection?: "incoming" | "outgoing" | "";
  conversationId?: string;
};

type Conversation = {
  id: string;
  peer: PlayerSummary;
  unreadCount: number;
  updatedAt: string;
  lastMessage: { text: string; linkUrl: string; imageUrl: string; createdAt: string } | null;
};

type ChatMessage = {
  id: string;
  text: string;
  linkUrl: string;
  imageUrl: string;
  createdAt: string;
  isMine: boolean;
};

type RequestItem = { id: string; from?: PlayerSummary; to?: PlayerSummary };

export default function PlayerChatCenter() {
  const [players, setPlayers] = useState<PlayerSummary[]>([]);
  const [incoming, setIncoming] = useState<RequestItem[]>([]);
  const [outgoing, setOutgoing] = useState<RequestItem[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [sendText, setSendText] = useState("");
  const [sendLink, setSendLink] = useState("");
  const [sendImage, setSendImage] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId]
  );

  async function loadSidebar() {
    const [playersRes, requestsRes, convRes] = await Promise.all([
      fetch("/api/chat/players", { cache: "no-store" }),
      fetch("/api/chat/requests", { cache: "no-store" }),
      fetch("/api/chat/conversations", { cache: "no-store" })
    ]);

    const playersData = await playersRes.json().catch(() => ({}));
    const requestsData = await requestsRes.json().catch(() => ({}));
    const convData = await convRes.json().catch(() => ({}));

    if (!playersRes.ok) throw new Error(playersData?.message || "Could not load chat players.");
    if (!requestsRes.ok) throw new Error(requestsData?.message || "Could not load chat requests.");
    if (!convRes.ok) throw new Error(convData?.message || "Could not load conversations.");

    setPlayers(playersData.players || []);
    setIncoming(requestsData.incomingPending || []);
    setOutgoing(requestsData.outgoingPending || []);
    setConversations(convData.conversations || []);
    if (!selectedConversationId && (convData.conversations || []).length > 0) {
      setSelectedConversationId(String(convData.conversations[0].id));
    }
  }

  async function loadMessages(conversationId: string) {
    setLoadingMessages(true);
    const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, { cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    setLoadingMessages(false);
    if (!res.ok) throw new Error(data?.message || "Could not load messages.");
    setMessages(data.messages || []);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await loadSidebar();
      } catch (e: any) {
        if (mounted) setError(String(e?.message || "Could not initialize chat."));
      }
    })();
    const timer = setInterval(() => {
      loadSidebar().catch(() => null);
    }, 4500);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  useEffect(() => {
    if (!selectedConversationId) return;
    loadMessages(selectedConversationId).catch((e) => setError(String(e?.message || "Could not load messages.")));
    const timer = setInterval(() => {
      loadMessages(selectedConversationId).catch(() => null);
    }, 3000);
    return () => clearInterval(timer);
  }, [selectedConversationId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendRequest(recipientUserId: string) {
    setError("");
    setNote("");
    const res = await fetch("/api/chat/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ recipientUserId })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.message || "Could not send request.");
      return;
    }
    setNote(data?.message || "Chat request sent.");
    await loadSidebar();
  }

  async function actOnRequest(requestId: string, action: "accept" | "reject" | "cancel") {
    setError("");
    setNote("");
    const res = await fetch(`/api/chat/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data?.message || "Could not update request.");
      return;
    }
    setNote(data?.message || "Request updated.");
    await loadSidebar();
  }

  async function onUploadImage(file: File) {
    if (file.size > 10 * 1024 * 1024) {
      setError("Image is too large. Maximum file size is 10 MB.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const transformation = "c_limit,w_1280,h_720,q_auto,f_auto";
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "ecb-lightforce/chat", purpose: "chat", transformation })
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
      formData.append("transformation", signData.transformation || transformation);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`, {
        method: "POST",
        body: formData
      });
      const uploaded = await uploadRes.json().catch(() => ({}));
      if (!uploadRes.ok || !uploaded?.secure_url) {
        throw new Error(uploaded?.error?.message || "Image upload failed.");
      }
      setSendImage(String(uploaded.secure_url));
      setNote("Image uploaded (max 720p enforced).");
    } catch (e: any) {
      setError(String(e?.message || "Image upload failed."));
    } finally {
      setUploading(false);
    }
  }

  async function onSendMessage(e: FormEvent) {
    e.preventDefault();
    if (!selectedConversationId) return;
    setSending(true);
    setError("");
    setNote("");
    const res = await fetch(`/api/chat/conversations/${selectedConversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: sendText, linkUrl: sendLink, imageUrl: sendImage })
    });
    const data = await res.json().catch(() => ({}));
    setSending(false);
    if (!res.ok) {
      setError(data?.message || "Could not send message.");
      return;
    }
    setSendText("");
    setSendLink("");
    setSendImage("");
    await loadMessages(selectedConversationId);
    await loadSidebar();
  }

  return (
    <section className="grid gap-4 lg:grid-cols-[1.2fr_2fr]">
      <div className="space-y-4">
        <div className="glass-panel p-4">
          <h2 className="font-display text-2xl text-white">Player Chat Requests</h2>
          <p className="mt-1 text-xs text-white/70">Send request first. Chat opens only after acceptance.</p>

          {incoming.length ? (
            <div className="mt-3 space-y-2">
              {incoming.map((req) => (
                <div key={req.id} className="glass-soft flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{req.from?.name}</p>
                    <p className="text-xs text-white/70">{req.from?.location || "Player"}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-primary text-xs" onClick={() => actOnRequest(req.id, "accept")}>Accept</button>
                    <button className="btn-muted text-xs" onClick={() => actOnRequest(req.id, "reject")}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/70">No incoming requests.</p>
          )}

          {outgoing.length ? (
            <div className="mt-3 space-y-2">
              {outgoing.map((req) => (
                <div key={req.id} className="glass-soft flex items-center justify-between p-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{req.to?.name}</p>
                    <p className="text-xs text-white/70">Request pending</p>
                  </div>
                  <button className="btn-muted text-xs" onClick={() => actOnRequest(req.id, "cancel")}>
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="glass-panel p-4">
          <h3 className="text-lg font-semibold text-white">Players</h3>
          <div className="mt-3 max-h-[280px] space-y-2 overflow-auto pr-1">
            {players.map((player) => (
              <div key={player.userId} className="glass-soft flex items-center justify-between p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{player.name}</p>
                  <p className="truncate text-xs text-white/70">{player.location || player.headline}</p>
                </div>
                {player.conversationId ? (
                  <button className="btn-primary text-xs" onClick={() => setSelectedConversationId(player.conversationId || "")}>
                    Open
                  </button>
                ) : player.requestStatus === "pending" && player.requestDirection === "outgoing" ? (
                  <span className="text-xs text-white/70">Pending</span>
                ) : player.requestStatus === "pending" && player.requestDirection === "incoming" ? (
                  <span className="text-xs text-pitch-200">Check requests</span>
                ) : (
                  <button className="btn-muted text-xs" onClick={() => sendRequest(player.userId)}>
                    Request
                  </button>
                )}
              </div>
            ))}
            {!players.length ? <p className="text-sm text-white/70">No players available.</p> : null}
          </div>
        </div>
      </div>

      <div className="glass-panel flex min-h-[620px] flex-col p-4">
        <div className="border-b border-white/10 pb-3">
          <p className="text-xs uppercase tracking-[0.14em] text-pitch-200">Chat Room</p>
          <h3 className="text-xl font-semibold text-white">{selectedConversation?.peer?.name || "Select a conversation"}</h3>
          <p className="text-xs text-white/70">{selectedConversation?.peer?.headline || "Accepted requests appear here."}</p>
        </div>

        <div className="mt-3 flex-1 space-y-2 overflow-auto pr-1">
          {loadingMessages ? <p className="text-sm text-white/70">Loading messages...</p> : null}
          {!selectedConversationId ? <p className="text-sm text-white/70">Open or accept a chat to start messaging.</p> : null}
          {selectedConversationId && !messages.length ? <p className="text-sm text-white/70">No messages yet.</p> : null}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`max-w-[86%] rounded-xl border p-3 ${m.isMine ? "ml-auto border-pitch-300/40 bg-pitch-300/10" : "border-white/15 bg-white/5"}`}
            >
              {m.text ? <p className="text-sm text-white">{m.text}</p> : null}
              {m.linkUrl ? (
                <a href={m.linkUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-pitch-200 underline">
                  {m.linkUrl}
                </a>
              ) : null}
              {m.imageUrl ? (
                <button type="button" className="mt-2 block" onClick={() => setPreviewImageUrl(m.imageUrl)}>
                  <img src={m.imageUrl} alt="Shared media" className="h-36 w-52 rounded-lg border border-white/15 object-cover transition hover:opacity-90" />
                </button>
              ) : null}
              <p className="mt-1 text-[10px] text-white/60">{new Date(m.createdAt).toLocaleString()}</p>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form onSubmit={onSendMessage} className="mt-3 space-y-2 border-t border-white/10 pt-3">
          <textarea
            className="input min-h-20"
            placeholder="Write your update..."
            value={sendText}
            onChange={(e) => setSendText(e.target.value)}
            disabled={!selectedConversationId || sending}
          />
          <input
            className="input"
            placeholder="Share link (optional)"
            value={sendLink}
            onChange={(e) => setSendLink(e.target.value)}
            disabled={!selectedConversationId || sending}
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white">
              {uploading ? "..." : <MediaIcon />}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={!selectedConversationId || sending || uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadImage(file);
                  e.currentTarget.value = "";
                }}
              />
            </label>
            {sendImage ? (
              <div className="relative overflow-hidden rounded-lg border border-white/15">
                <img src={sendImage} alt="Pending upload" className="h-16 w-24 object-cover" />
                <button
                  type="button"
                  className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/65 text-xs text-white"
                  onClick={() => setSendImage("")}
                  aria-label="Remove image"
                >
                  x
                </button>
              </div>
            ) : (
              <p className="text-xs text-white/65">Add media (max 10 MB, auto-limited to 720p)</p>
            )}
          </div>
          <button className="btn-primary w-full justify-center" disabled={!selectedConversationId || sending || uploading}>
            {sending ? "Sending..." : "Send Message"}
          </button>
        </form>
      </div>

      {previewImageUrl ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onClick={() => setPreviewImageUrl("")}
        >
          <div className="glass-panel max-h-[90vh] max-w-4xl overflow-hidden p-2" onClick={(e) => e.stopPropagation()}>
            <img src={previewImageUrl} alt="Chat media preview" className="max-h-[84vh] w-auto max-w-full rounded-xl object-contain" />
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      {note ? <p className="text-sm text-pitch-200">{note}</p> : null}
    </section>
  );
}

function MediaIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h11A2.5 2.5 0 0 1 20 7.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 15l2.5-2.5L13 15l1.5-1.5L17 16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="9.5" r="1.1" fill="currentColor" />
    </svg>
  );
}
