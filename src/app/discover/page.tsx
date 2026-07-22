"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Heart, Star, X } from "lucide-react";
import { motion } from "framer-motion";
import { Button, Card } from "@/components/ui";
import { SwipeCard, type Candidate, type SwipeAction, type SwipeCardHandle } from "@/components/swipe-card";

export default function DiscoverPage() {
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [index, setIndex] = useState(0);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [matchedWith, setMatchedWith] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const frontCardRef = useRef<SwipeCardHandle>(null);

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
  const stack = candidates?.slice(index, index + 3) ?? [];

  async function recordSwipe(candidate: Candidate, action: SwipeAction) {
    const res = await fetch("/api/swipe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        candidate.isTeam
          ? { toTeamId: candidate.id, action }
          : { toUserId: candidate.id, action }
      ),
    });
    const data = await res.json();
    if (res.ok && data.matched) {
      setMatchedWith(current?.name ?? null);
      setMatchId(data.matchId);
    }
  }

  // Called by SwipeCard once its own fly-off animation has finished.
  function handleCardExited(action: SwipeAction) {
    if (!current) return;
    void recordSwipe(current, action).finally(() => setBusy(false));
    setShowBreakdown(false);
    setIndex((i) => i + 1);
  }

  function triggerSwipe(action: SwipeAction) {
    if (!current || busy) return;
    frontCardRef.current?.triggerSwipe(action);
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
      <div className="relative h-[68vh] max-h-[640px] min-h-[420px] w-full">
        {stack.map((candidate, position) => (
          <SwipeCard
            key={candidate.id}
            ref={position === 0 ? frontCardRef : undefined}
            candidate={candidate}
            stackPosition={position}
            busy={busy}
            showBreakdown={position === 0 && showBreakdown}
            onToggleBreakdown={() => setShowBreakdown((s) => !s)}
            onSwipeStart={() => setBusy(true)}
            onSwipe={handleCardExited}
          />
        ))}
      </div>

      <div className="mt-6 flex items-center justify-center gap-5">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={() => triggerSwipe("PASS")}
          disabled={busy}
          aria-label="Pass"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-card text-red-500 shadow-lg shadow-black/10 ring-1 ring-border transition disabled:opacity-50"
        >
          <X className="h-7 w-7" />
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={() => triggerSwipe("SUPER_LIKE")}
          disabled={busy}
          aria-label="Super like"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-card text-sky-400 shadow-lg shadow-black/10 ring-1 ring-border transition disabled:opacity-50"
        >
          <Star className="h-6 w-6" />
        </motion.button>
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          onClick={() => triggerSwipe("LIKE")}
          disabled={busy}
          aria-label="Like"
          className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/30 transition disabled:opacity-50"
        >
          <Heart className="h-7 w-7 fill-current" />
        </motion.button>
      </div>

      {matchedWith && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4">
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
