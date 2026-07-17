"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { formatDistanceToNow } from "date-fns";

type MatchSummary = {
  matchId: string;
  createdAt: string;
  otherUser: { id: string; name: string; photoUrl: string | null };
  lastMessage: { content: string; createdAt: string } | null;
};

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchSummary[] | null>(null);

  useEffect(() => {
    fetch("/api/matches")
      .then((res) => res.json())
      .then((data) => setMatches(data.matches ?? []));
  }, []);

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-2xl font-bold">Your matches</h1>

      {matches === null && <p className="mt-6 text-sm text-muted">Loading…</p>}

      {matches?.length === 0 && (
        <p className="mt-6 text-sm text-muted">
          No matches yet.{" "}
          <Link href="/discover" className="text-primary font-medium">
            Start swiping
          </Link>{" "}
          to find your roommate.
        </p>
      )}

      <div className="mt-6 space-y-3">
        {matches?.map((m) => (
          <Link key={m.matchId} href={`/matches/${m.matchId}`}>
            <Card className="flex items-center gap-4 p-4 transition hover:border-primary/40">
              <Avatar
                name={m.otherUser.name}
                photoUrl={m.otherUser.photoUrl}
                className="h-12 w-12 shrink-0 text-lg"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{m.otherUser.name}</p>
                <p className="truncate text-sm text-muted">
                  {m.lastMessage ? m.lastMessage.content : "Say hello 👋"}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted">
                {formatDistanceToNow(new Date(m.lastMessage?.createdAt ?? m.createdAt), {
                  addSuffix: true,
                })}
              </span>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
