"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  type PanInfo,
} from "framer-motion";
import { BadgeCheck, KeyRound, Users } from "lucide-react";
import type { CompatibilityFactor } from "@/lib/matching";
import type { Candidate } from "@/lib/candidate";
import { Avatar } from "@/components/avatar";

export type { CompatibilityFactor, Candidate };

export type SwipeAction = "LIKE" | "SUPER_LIKE" | "PASS";

export type SwipeCardHandle = {
  triggerSwipe: (action: SwipeAction) => void;
};

type SwipeCardProps = {
  candidate: Candidate;
  stackPosition: number;
  busy: boolean;
  showBreakdown: boolean;
  onToggleBreakdown: () => void;
  onSwipeStart: () => void;
  onSwipe: (action: SwipeAction) => void;
};

function CompatibilityRing({ score }: { score: number }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex h-14 w-14 items-center justify-center">
      <svg width="56" height="56" className="-rotate-90">
        <circle cx="28" cy="28" r={radius} stroke="rgba(255,255,255,0.3)" strokeWidth="4" fill="none" />
        <circle
          cx="28"
          cy="28"
          r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-sm font-bold text-white">{score}%</span>
    </div>
  );
}

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(function SwipeCard(
  { candidate, stackPosition, busy, showBreakdown, onToggleBreakdown, onSwipeStart, onSwipe },
  ref
) {
  const isFront = stackPosition === 0;
  const reduceMotion = useReducedMotion();
  const [imageError, setImageError] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const depthY = useMotionValue(isFront ? 0 : stackPosition * 14);
  const depthScale = useMotionValue(isFront ? 1 : 1 - stackPosition * 0.05);
  const depthOpacity = useMotionValue(isFront ? 1 : 1 - stackPosition * 0.15);

  const rotate = useTransform(x, [-320, 320], reduceMotion ? [0, 0] : [-18, 18]);
  const likeOpacity = useTransform(x, [20, 120], [0, 1]);
  const nopeOpacity = useTransform(x, [-120, -20], [1, 0]);
  const dragFade = useTransform(x, [-320, -220, 0, 220, 320], [0, 1, 1, 1, 0]);

  useEffect(() => {
    if (isFront) return;
    const springConfig = reduceMotion
      ? { duration: 0.15 }
      : { type: "spring" as const, stiffness: 300, damping: 30 };
    animate(depthY, stackPosition * 14, springConfig);
    animate(depthScale, 1 - stackPosition * 0.05, springConfig);
    animate(depthOpacity, 1 - stackPosition * 0.15, springConfig);
  }, [stackPosition, isFront, depthY, depthScale, depthOpacity, reduceMotion]);

  async function fly(action: SwipeAction) {
    onSwipeStart();
    const duration = reduceMotion ? 0.12 : 0.32;
    if (action === "SUPER_LIKE") {
      await animate(y, -(typeof window !== "undefined" ? window.innerHeight : 800), {
        duration,
        ease: "easeIn",
      });
    } else {
      const distance = (typeof window !== "undefined" ? window.innerWidth : 600) + 200;
      const target = action === "PASS" ? -distance : distance;
      await animate(x, target, { duration, ease: "easeIn" });
    }
    onSwipe(action);
  }

  useImperativeHandle(ref, () => ({ triggerSwipe: fly }));

  function handleDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (busy) return;
    if (info.offset.x > 120 || info.velocity.x > 600) {
      fly("LIKE");
    } else if (info.offset.x < -120 || info.velocity.x < -600) {
      fly("PASS");
    }
  }

  return (
    <motion.div
      style={{
        zIndex: 10 - stackPosition,
        x: isFront ? x : 0,
        y: isFront ? y : depthY,
        rotate: isFront ? rotate : 0,
        scale: isFront ? 1 : depthScale,
        opacity: isFront ? dragFade : depthOpacity,
      }}
      drag={isFront && !busy ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={1}
      onDragEnd={isFront ? handleDragEnd : undefined}
      className="absolute inset-0 select-none overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-black/10"
    >
      <div className="absolute inset-0">
        {candidate.photoUrl && !imageError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={candidate.photoUrl}
            alt={candidate.name}
            draggable={false}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="relative h-full w-full bg-gradient-to-br from-primary/30 to-accent/30">
            {/* Centered in the top 2/5 only, clear of the bottom gradient + text overlay
                below, so the letter doesn't visually clash with the name/badges. */}
            <div className="absolute inset-x-0 top-0 flex h-2/5 items-center justify-center">
              <span className="text-7xl font-bold text-primary/70">
                {candidate.name.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-3/5 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
      </div>

      {isFront && (
        <>
          <motion.div
            style={{ opacity: likeOpacity }}
            className="pointer-events-none absolute left-6 top-8 z-20 -rotate-12 rounded-lg border-4 border-emerald-400 px-3 py-1 text-2xl font-black tracking-wider text-emerald-400"
          >
            LIKE
          </motion.div>
          <motion.div
            style={{ opacity: nopeOpacity }}
            className="pointer-events-none absolute right-6 top-8 z-20 rotate-12 rounded-lg border-4 border-red-500 px-3 py-1 text-2xl font-black tracking-wider text-red-500"
          >
            NOPE
          </motion.div>
        </>
      )}

      {isFront && (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleBreakdown();
          }}
          aria-label="Show match breakdown"
          className="absolute right-4 top-4 z-10 rounded-full bg-black/30 text-white backdrop-blur-sm transition hover:bg-black/45"
        >
          <CompatibilityRing score={candidate.compatibilityScore} />
        </button>
      )}

      {isFront && (
      <div className="absolute inset-x-0 bottom-0 z-10 p-5 text-white">
        {candidate.isTeam && (
          <div className="mb-2 flex -space-x-2">
            {candidate.members.map((member) => (
              <Avatar
                key={member.userId}
                name={member.name}
                photoUrl={member.photoUrl}
                className="h-8 w-8 border-2 border-black/40 text-xs"
              />
            ))}
          </div>
        )}
        <div className="mb-2 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
            {candidate.listingType === "HAS_ROOM" ? (
              <>
                <KeyRound className="h-3 w-3" /> Has a room
              </>
            ) : (
              <>
                <Users className="h-3 w-3" /> Looking for a room together
              </>
            )}
          </span>
          {candidate.isTeam && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
              <Users className="h-3 w-3" /> Team of {candidate.members.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-bold [text-shadow:0_1px_6px_rgb(0_0_0_/_0.5)]">
            {candidate.isTeam ? candidate.name : `${candidate.name}, ${candidate.age}`}
          </h2>
          {candidate.verified && <BadgeCheck className="h-5 w-5 shrink-0 text-sky-400" />}
        </div>
        <p className="mt-1 text-sm text-white/85">
          {candidate.college}
          {candidate.course ? ` · ${candidate.course}` : ""}
        </p>
        <p className="text-sm text-white/70">
          {candidate.city}
          {candidate.preferredArea ? ` · ${candidate.preferredArea}` : ""}
        </p>
        <p className="mt-1.5 text-sm text-white/80">
          ₹{candidate.budgetMin.toLocaleString()}–₹{candidate.budgetMax.toLocaleString()}/mo
        </p>

        {candidate.bio && (
          <p className="mt-2 line-clamp-2 text-sm text-white/90">{candidate.bio}</p>
        )}

        {candidate.interests.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {candidate.interests.slice(0, 5).map((interest) => (
              <span
                key={interest}
                className="rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-xs backdrop-blur-sm"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>
      )}

      {isFront && (
        <motion.div
          initial={false}
          animate={{ y: showBreakdown ? 0 : "100%" }}
          transition={
            reduceMotion
              ? { duration: 0.15 }
              : { type: "spring", stiffness: 320, damping: 34 }
          }
          className="absolute inset-x-0 bottom-0 z-30 max-h-[75%] overflow-y-auto rounded-t-3xl bg-card/97 p-5 text-foreground shadow-2xl backdrop-blur-md"
        >
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-foreground/20" />
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Why you matched</p>
          <div className="mt-3 space-y-3">
            {candidate.compatibilityBreakdown.map((f) => (
              <div key={f.factor}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{f.factor}</span>
                  <span className="text-muted">{Math.round(f.score * 100)}%</span>
                </div>
                <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-foreground/10">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round(f.score * 100)}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted">{f.reason}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
});
