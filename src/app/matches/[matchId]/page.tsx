"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { Button, Input } from "@/components/ui";

type Message = {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
};

export default function ChatPage() {
  const params = useParams<{ matchId: string }>();
  const matchId = params.matchId;

  const [otherName, setOtherName] = useState<string | null>(null);
  const [meId, setMeId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setMeId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    fetch(`/api/matches/${matchId}`)
      .then((res) => res.json())
      .then((data) => setOtherName(data.otherUser?.name ?? "Roomie"));
  }, [matchId]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const res = await fetch(`/api/matches/${matchId}/messages`);
      const data = await res.json();
      if (!cancelled && res.ok) {
        setMessages(data.messages);
        setLoading(false);
      }
    }

    load();
    const interval = setInterval(load, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [matchId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-6">
      <div className="border-b border-border pb-3">
        <h1 className="text-lg font-semibold">{otherName ?? "…"}</h1>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto py-4">
        {loading && <p className="text-sm text-muted">Loading messages…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-sm text-muted">You matched! Say hello 👋</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === meId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  mine ? "bg-primary text-primary-foreground" : "bg-foreground/5"
                }`}
              >
                {m.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={sendMessage} className="flex items-center gap-2 border-t border-border pt-4">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
        />
        <Button type="submit" disabled={!draft.trim()}>
          Send
        </Button>
      </form>
    </div>
  );
}
