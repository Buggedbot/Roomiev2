"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { format } from "date-fns";
import { CheckCheck, Ellipsis, Image as ImageIcon, Loader2, Pencil, Send, Trash2, X } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { Avatar } from "@/components/avatar";

type Message = {
  id: string;
  senderId: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  editedAt: string | null;
  deletedAt: string | null;
  readAt: string | null;
};

export default function ChatPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;

  const [header, setHeader] = useState<{ name: string; photoUrl: string | null } | null>(null);
  const [isGroup, setIsGroup] = useState(false);
  const [participants, setParticipants] = useState<Map<string, string>>(new Map());
  const [meId, setMeId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [typingName, setTypingName] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const meIdRef = useRef<string | null>(null);
  const participantsRef = useRef<Map<string, string>>(new Map());
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  useEffect(() => {
    meIdRef.current = meId;
  }, [meId]);

  useEffect(() => {
    participantsRef.current = participants;
  }, [participants]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setMeId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    fetch(`/api/matches/${matchId}`)
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error ?? "Unable to load this match");
        return data;
      })
      .then((data) => {
        setMatchError(null);
        setHeader({
          name: data.headerName ?? "Roomie",
          photoUrl: data.headerPhotoUrl ?? null,
        });
        setIsGroup(Boolean(data.isGroup));
        setParticipants(
          new Map((data.participants ?? []).map((p: { id: string; name: string }) => [p.id, p.name]))
        );
      })
      .catch((error: Error) => {
        setMatchError(error.message);
      });
  }, [matchId]);

  useEffect(() => {
    fetch(`/api/matches/${matchId}/messages`)
      .then((res) => res.json())
      .then((data) => {
        if (data.messages) setMessages(data.messages);
      })
      .finally(() => setLoading(false));
  }, [matchId]);

  useEffect(() => {
    const source = new EventSource(`/api/matches/${matchId}/stream`);

    source.onmessage = (event) => {
      const payload = JSON.parse(event.data);

      if (payload.type === "message") {
        if (payload.message.senderId === meIdRef.current) return;
        setMessages((prev) => [...prev, payload.message]);
        // Actively viewing this chat — mark the new message read right away.
        fetch(`/api/matches/${matchId}/messages`).catch(() => {});
      } else if (payload.type === "edit") {
        setMessages((prev) => prev.map((m) => (m.id === payload.message.id ? payload.message : m)));
      } else if (payload.type === "delete") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === payload.messageId ? { ...m, deletedAt: new Date().toISOString(), content: "", imageUrl: null } : m
          )
        );
      } else if (payload.type === "read") {
        if (payload.readerId === meIdRef.current) return;
        setMessages((prev) =>
          prev.map((m) => (m.senderId === meIdRef.current && !m.readAt ? { ...m, readAt: payload.readAt } : m))
        );
      } else if (payload.type === "typing") {
        if (payload.userId === meIdRef.current) return;
        setTypingName(participantsRef.current.get(payload.userId) ?? "Someone");
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setTypingName(null), 4000);
      }
    };

    return () => {
      source.close();
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, typingName]);

  useEffect(() => {
    if (!openMenuId) return;
    function handleClickOutside(event: MouseEvent) {
      if (!(event.target as HTMLElement).closest("[data-message-menu]")) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [openMenuId]);

  function notifyTyping() {
    const now = Date.now();
    if (now - lastTypingSentRef.current < 2000) return;
    lastTypingSentRef.current = now;
    fetch(`/api/matches/${matchId}/typing`, { method: "POST" }).catch(() => {});
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setDraft("");

    const res = await fetch(`/api/matches/${matchId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessages((prev) => [...prev, data.message]);
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/matches/${matchId}/messages/image`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json().catch(() => null);
      if (res.ok && data?.message) {
        setMessages((prev) => [...prev, data.message]);
      }
    } finally {
      setUploadingImage(false);
    }
  }

  function startEdit(message: Message) {
    setOpenMenuId(null);
    setEditingId(message.id);
    setEditDraft(message.content);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditDraft("");
  }

  async function saveEdit(messageId: string) {
    const content = editDraft.trim();
    if (!content) return;
    const res = await fetch(`/api/matches/${matchId}/messages/${messageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessages((prev) => prev.map((m) => (m.id === messageId ? data.message : m)));
      cancelEdit();
    }
  }

  async function deleteMessage(messageId: string) {
    setOpenMenuId(null);
    const res = await fetch(`/api/matches/${matchId}/messages/${messageId}`, { method: "DELETE" });
    if (res.ok) {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, deletedAt: new Date().toISOString(), content: "", imageUrl: null } : m))
      );
    }
  }

  const lastMineWithReadAt = [...messages].reverse().find((m) => m.senderId === meId && !m.deletedAt);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <Avatar
          name={header?.name ?? "?"}
          photoUrl={header?.photoUrl}
          className="h-9 w-9 text-sm"
        />
        <div>
          <h1 className="text-lg font-semibold">{header?.name ?? "…"}</h1>
          {typingName && <p className="text-xs text-primary">{typingName} typing…</p>}
        </div>
      </div>

      {matchError && <p className="py-6 text-sm text-red-500">{matchError}</p>}

      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {loading && <p className="text-sm text-muted">Loading messages…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-muted">You matched! Say hello 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === meId;
          const isEditing = editingId === m.id;

          return (
            <div key={m.id} className={`group flex items-end gap-1.5 ${mine ? "justify-end" : "justify-start"}`}>
              {mine && !m.deletedAt && !isEditing && (
                <div
                  data-message-menu
                  className={`relative shrink-0 pb-1 transition-opacity group-hover:opacity-100 ${
                    openMenuId === m.id ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <button
                    type="button"
                    aria-label="Message options"
                    onClick={() => setOpenMenuId(openMenuId === m.id ? null : m.id)}
                    className="flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-foreground/10 hover:text-foreground"
                  >
                    <Ellipsis className="h-3.5 w-3.5" />
                  </button>
                  {openMenuId === m.id && (
                    <div className="absolute right-0 bottom-7 z-10 w-32 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
                      {!m.imageUrl && (
                        <button
                          type="button"
                          onClick={() => startEdit(m)}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-foreground/5"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => deleteMessage(m.id)}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="max-w-[75%]">
                {isGroup && !mine && !m.deletedAt && (
                  <p className="mb-0.5 px-1 text-xs font-medium text-muted">
                    {participants.get(m.senderId) ?? "Someone"}
                  </p>
                )}
                <div
                  className={`rounded-2xl px-4 py-2 text-sm ${
                    m.deletedAt
                      ? "italic text-muted bg-foreground/5"
                      : mine
                        ? "bg-primary text-primary-foreground"
                        : "bg-foreground/5"
                  }`}
                >
                {m.deletedAt ? (
                  "Message deleted"
                ) : isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={editDraft}
                      onChange={(e) => setEditDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEdit(m.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="w-40 rounded-lg bg-primary-foreground/20 px-2 py-1 text-sm outline-none"
                    />
                    <button type="button" onClick={() => saveEdit(m.id)} aria-label="Save edit">
                      <CheckCheck className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={cancelEdit} aria-label="Cancel edit">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    {m.imageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.imageUrl}
                        alt="Shared photo"
                        className="max-h-64 w-full rounded-xl object-cover"
                      />
                    )}
                    {m.content && <p className={m.imageUrl ? "mt-2" : undefined}>{m.content}</p>}
                  </>
                )}

                {!m.deletedAt && !isEditing && (
                  <div
                    className={`mt-1 flex items-center gap-1 text-[10px] ${
                      mine ? "text-primary-foreground/70" : "text-muted"
                    }`}
                  >
                    <span>{format(new Date(m.createdAt), "h:mm a")}</span>
                    {m.editedAt && <span>· edited</span>}
                  </div>
                )}
                </div>
              </div>
            </div>
          );
        })}

        {lastMineWithReadAt?.readAt && (
          <div className="flex items-center justify-end gap-1 pr-1 text-[10px] text-muted">
            <CheckCheck className="h-3 w-3 text-primary" /> Seen
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border pt-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImage}
          aria-label="Attach photo"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-foreground/5 hover:text-primary disabled:opacity-50"
        >
          {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
        </button>
        <Input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            notifyTyping();
          }}
          placeholder="Type a message…"
        />
        <Button type="submit" disabled={!draft.trim()}>
          <Send className="h-4 w-4" /> Send
        </Button>
      </form>
    </div>
  );
}
