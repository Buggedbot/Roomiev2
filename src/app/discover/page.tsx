"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { Avatar } from "@/components/avatar";

type CompatibilityFactor = {
  factor: string;
  weight: number;
  score: number;
  reason: string;
};

type Candidate = {
  userId: string;
  name: string;
  age: number;
  bio: string;
  college: string;
  course: string | null;
  city: string;
  preferredArea: string | null;
  budgetMin: number;
  budgetMax: number;
  interests: string[];
  verified: boolean;
  photoUrl: string | null;
  compatibilityScore: number;
  compatibilityBreakdown: CompatibilityFactor[];
};

export default function DiscoverPage() {
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [index, setIndex] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [matchedWith, setMatchedWith] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/discover")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? "Something went wrong");
          return;
        }
        setCandidates(data.candidates);
      })
      .catch(() => setError("Failed to load candidates"));
  }, []);

  const current = candidates?.[index];

  async function swipe(action: "LIKE" | "SUPER_LIKE" | "PASS") {
    if (!current || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/swipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toUserId: current.userId, action }),
      });
      const data = await res.json();
      if (res.ok && data.matched) {
        setMatchedWith(current.name);
        setMatchId(data.matchId);
      }
      setShowBreakdown(false);
      setIndex((i) => i + 1);
    } finally {
      setBusy(false);
    }
  }

  if (error === "Complete your profile first") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-medium">Finish your profile to start discovering roommates.</p>
        <Link href="/profile/setup">
          <Button>Complete profile</Button>
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 text-center text-red-500">
        {error}
      </div>
    );
  }

  if (!candidates) {
    return <div className="flex flex-1 items-center justify-center text-muted">Loading…</div>;
  }

  if (!current) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-lg font-medium">You&apos;re all caught up!</p>
        <p className="text-sm text-muted">Check back later for new potential roommates.</p>
        <Link href="/matches">
          <Button variant="secondary">View your matches</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 py-8">
      <Card className="flex flex-1 flex-col overflow-hidden">
        {current.photoUrl ? (
          <div className="aspect-[4/3] w-full overflow-hidden bg-foreground/5">
            <Avatar name={current.name} photoUrl={current.photoUrl} className="h-full w-full" />
          </div>
        ) : (
          <div className="flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/20 py-10">
            <Avatar name={current.name} className="h-24 w-24 text-3xl" />
          </div>
        )}

        <div className="flex-1 space-y-4 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold">
                {current.name}, {current.age}
              </h2>
              <p className="text-sm text-muted">
                {current.college}
                {current.course ? ` · ${current.course}` : ""}
              </p>
              <p className="text-sm text-muted">
                {current.city}
                {current.preferredArea ? ` · ${current.preferredArea}` : ""}
              </p>
            </div>
            <button
              onClick={() => setShowBreakdown((s) => !s)}
              className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <span className="text-lg font-bold leading-none">{current.compatibilityScore}%</span>
              <span className="text-[10px] leading-none">match</span>
            </button>
          </div>

          {current.bio && <p className="text-sm">{current.bio}</p>}

          <p className="text-sm text-muted">
            Budget: ₹{current.budgetMin.toLocaleString()}–₹{current.budgetMax.toLocaleString()}/mo
          </p>

          {current.interests.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {current.interests.map((interest) => (
                <span key={interest} className="rounded-full bg-foreground/5 px-3 py-1 text-xs">
                  {interest}
                </span>
              ))}
            </div>
          )}

          {showBreakdown && (
            <div className="space-y-2 rounded-xl border border-border bg-foreground/[0.03] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                Why you matched
              </p>
              {current.compatibilityBreakdown.map((f) => (
                <div key={f.factor} className="flex items-center justify-between text-sm">
                  <span>{f.factor}</span>
                  <span className="text-muted">{Math.round(f.score * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-center gap-4 border-t border-border p-4">
          <Button variant="outline" onClick={() => swipe("PASS")} disabled={busy} className="h-14 w-14 !rounded-full !p-0 text-xl">
            ✕
          </Button>
          <Button onClick={() => swipe("SUPER_LIKE")} disabled={busy} variant="secondary" className="h-14 w-14 !rounded-full !p-0 text-xl">
            ★
          </Button>
          <Button onClick={() => swipe("LIKE")} disabled={busy} className="h-14 w-14 !rounded-full !p-0 text-xl">
            ♥
          </Button>
        </div>
      </Card>

      {matchedWith && (
        <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 px-4">
          <Card className="w-full max-w-sm p-8 text-center">
            <h3 className="text-2xl font-bold text-primary">It&apos;s a match!</h3>
            <p className="mt-2 text-sm text-muted">You and {matchedWith} liked each other.</p>
            <div className="mt-6 flex flex-col gap-2">
              {matchId && (
                <Link href={`/matches/${matchId}`}>
                  <Button className="w-full">Send a message</Button>
                </Link>
              )}
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setMatchedWith(null);
                  setMatchId(null);
                }}
              >
                Keep swiping
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
