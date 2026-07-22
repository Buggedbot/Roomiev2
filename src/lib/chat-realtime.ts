import type { Message } from "@/generated/prisma/client";

export type ChatEvent =
  | { type: "message"; message: Message }
  | { type: "edit"; message: Message }
  | { type: "delete"; messageId: string }
  | { type: "read"; readerId: string; readAt: string }
  | { type: "typing"; userId: string };

type Listener = (event: ChatEvent) => void;

// In-memory pub/sub for live chat updates via Server-Sent Events. This only
// fans out within a single Node process — fine for `next dev` / a single
// server instance, but a multi-instance production deployment would need a
// shared broker (e.g. Redis pub/sub) for messages to cross instances.
const channels = new Map<string, Set<Listener>>();

export function subscribe(matchId: string, listener: Listener): () => void {
  let listeners = channels.get(matchId);
  if (!listeners) {
    listeners = new Set();
    channels.set(matchId, listeners);
  }
  listeners.add(listener);

  return () => {
    listeners?.delete(listener);
    if (listeners && listeners.size === 0) channels.delete(matchId);
  };
}

export function publish(matchId: string, event: ChatEvent): void {
  channels.get(matchId)?.forEach((listener) => listener(event));
}
