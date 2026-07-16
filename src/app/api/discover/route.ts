import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { computeCompatibility, passesHardFilters } from "@/lib/matching";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.profile.findUnique({ where: { userId } });
  if (!me) {
    return NextResponse.json(
      { error: "Complete your profile first" },
      { status: 400 }
    );
  }

  const [alreadySwiped, candidates] = await Promise.all([
    prisma.like.findMany({
      where: { fromUserId: userId },
      select: { toUserId: true },
    }),
    prisma.profile.findMany({
      where: {
        isComplete: true,
        userId: { not: userId },
      },
    }),
  ]);

  const swipedIds = new Set(alreadySwiped.map((l) => l.toUserId));

  const results = candidates
    .filter((c) => !swipedIds.has(c.userId))
    .filter((c) => passesHardFilters(me, c))
    .map((c) => {
      const { score, breakdown } = computeCompatibility(me, c);
      return {
        userId: c.userId,
        name: c.name,
        age: c.age,
        bio: c.bio,
        college: c.college,
        course: c.course,
        city: c.city,
        preferredArea: c.preferredArea,
        budgetMin: c.budgetMin,
        budgetMax: c.budgetMax,
        interests: c.interests,
        verified: c.verified,
        compatibilityScore: score,
        compatibilityBreakdown: breakdown,
      };
    })
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  return NextResponse.json({ candidates: results });
}
