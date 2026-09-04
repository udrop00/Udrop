"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminShell } from "../../components";
import { apiFetch, apiMe, clearSession, getSession } from "../../lib";
import { useRouter } from "next/navigation";

type Message = { id: string; conversationId: string; senderId: string; text: string; imageUrl?: string; createdAt: string };
type Conversation = { id: string; customerId: string; status: string; updatedAt: string; customer?: { id: string; name: string; email: string } | null; messages: Message[] };

function useSupportStream(onData: (data: any) => void) {
  useEffect(() => {
    const session = getSession();
    if (!session?.token) return;
    const controller = new AbortController();
    let buffer = "";

    fetch("/api/support/stream?token=" + encodeURIComponent(session.token), {
      cache: "no-store",
      signal: controller.signal
    })
      .then(async (r) => {
        if (!r.ok || !r.body) throw new Error();
        const reader = r.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() || "";
          for (const chunk of chunks) {
            const line = chunk.split("\n").find((x) => x.startsWith("data: "));
            if (line) {
              try {
                onData(JSON.parse(line.slice(6)));
              } catch {}
            }
          }
        }
      })
      .catch(() => {});

    return () => controller.abort();
  }, [onData]);
}

function Chat({
  conversation,
  userId,
  onSent
}: {
  conversation: Conversation;
  userId: string;
  onSent: () => void;
}) {
  const [text, setText] = useState("");
  const [file, setFile] = useState("");
  const [sending, setSending] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch("/api/support", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "markRead", customerId: conversation.customerId })
    }).catch(() => {});
  }, [conversation.id, conversation.customerId]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if ((!text.trim() && !file) || sending) return;
    setSending(true);

    try {
      const r = await apiFetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), imageUrl: file, customerId: conversation.customerId })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Unable to send");
      setText("");
      setFile("");
      if (fileRef.current) fileRef.current.value = "";
      onSent();
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="chat-panel">
      <div className="chat-head">
        <div className="avatar">{conversation.customer?.name?.[0] || "C"}</div>
        <div>
          <b>{conversation.customer?.name || "Customer"}</b>
          <br />
          <small>{conversation.customer?.email}</small>
        </div>
      </div>

      <div className="messages">
        {conversation.messages.length === 0 ? (
          <div className="empty-state">No messages yet.</div>
        ) : (
          conversation.messages.map((m) => (
            <div className={"bubble-row " + (m.senderId === userId ? "user" : "")} key={m.id}>
              <div className={"bubble " + (m.senderId === userId ? "user" : "admin")}>
                {m.imageUrl && <img className="chat-image" src={m.imageUrl} alt="Attachment" />}
                {m.text && <div>{m.text}</div>}
                <small>{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</small>
              </div>
            </div>
          ))
        )}
      </div>

      <form className="chat-form" onSubmit={send}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a reply to customer..." disabled={sending} />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            const reader = new FileReader();
            reader.onload = () => setFile(String(reader.result));
            reader.readAsDataURL(f);
          }}
        />
        <button type="button" className="table-btn" onClick={() => fileRef.current?.click()}>
          📎 Image
        </button>
        <button className="btn" type="submit" disabled={sending}>
          {sending ? "Sending…" : "Send Reply"}
        </button>
      </form>

      {file && (
        <div className="attachment-preview">
          <img src={file} alt="Selected attachment" />
          <button
            className="table-btn danger-btn"
            onClick={() => {
              setFile("");
              if (fileRef.current) fileRef.current.value = "";
            }}
          >
            Remove
          </button>
        </div>
      )}
    </section>
  );
}

export default function AdminSupportPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selected, setSelected] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await apiFetch("/api/support?t=" + Date.now(), { cache: "no-store" });
      if (!r.ok) return;
      const d = await r.json();
      setConversations(d.conversations || []);
      setSelected((s) => s || d.conversations?.[0]?.id || "");
    } catch {}
  }, []);

  useEffect(() => {
    apiMe()
      .then((d) => {
        if (d.user.role !== "admin") {
          router.replace("/login");
          return;
        }
        setUserId(d.user.id);
        load();
      })
      .catch(() => {
        clearSession();
        router.replace("/login");
      })
      .finally(() => setLoading(false));
  }, [router, load]);

  useSupportStream((d) => {
    if (d.conversations) {
      setConversations(d.conversations);
    }
  });

  const active = useMemo(() => conversations.find((c) => c.id === selected) || null, [conversations, selected]);

  if (loading) {
    return <div className="loading-screen">Loading Live Support…</div>;
  }

  return (
    <AdminShell>
      <div className="topbar">
        <div>
          <span className="eyebrow">Customer Service</span>
          <h1>Live Support & Chat</h1>
        </div>
        <span className="admin-chip live-chip">
          <i /> {conversations.length} Active Conversations
        </span>
      </div>

      <div className="support-layout">
        <div className="conversation-list">
          <div className="side-label">Customers</div>
          {conversations.length === 0 ? (
            <div className="empty-state">No customer conversations yet.</div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                className={"conversation-item " + (c.id === selected ? "selected" : "")}
                onClick={() => setSelected(c.id)}
              >
                <span className="profile-avatar">{c.customer?.name?.[0] || "?"}</span>
                <span>
                  <b>{c.customer?.name || "Customer"}</b>
                  <small>{c.messages.at(-1)?.text || "Image attachment"}</small>
                </span>
                {Number((c as any).unreadCount || 0) > 0 && (
                  <span className="unread-dot" style={{ background: "#38bdf8", borderRadius: "50%", width: "8px", height: "8px", display: "inline-block" }} />
                )}
              </button>
            ))
          )}
        </div>

        {active ? (
          <Chat conversation={active} userId={userId} onSent={load} />
        ) : (
          <div className="empty-state">Select a customer conversation to start replying.</div>
        )}
      </div>
    </AdminShell>
  );
}
