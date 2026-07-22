import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import {
  averageCompatibility,
  computeCompatibility,
  isCompleteProfile,
  passesHardFilters,
} from "@/lib/matching";
import { formatTeamName, getActiveTeamForUser } from "@/lib/teams";
import type { Candidate } from "@/lib/candidate";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const me = await prisma.profile.findUnique({ where: { userId } });
  if (!me || !isCompleteProfile(me)) {
    return NextResponse.json(
      { error: "Complete your profile first" },
      { status: 400 }
    );
  }

  const [swipedUsers, swipedTeams, candidates] = await Promise.all([
    prisma.like.findMany({ where: { fromUserId: userId }, select: { toUserId: true } }),
    prisma.teamLike.findMany({
      where: { userId, direction: "FROM_USER" },
      select: { teamId: true },
    }),
    prisma.profile.findMany({
      where: { isComplete: true, userId: { not: userId } },
      include: {
        user: {
          include: { photos: { orderBy: { position: "asc" }, take: 1 } },
        },
      },
    }),
  ]);

  const swipedUserIds = new Set(swipedUsers.map((l) => l.toUserId));
  const swipedTeamIds = new Set(swipedTeams.map((t) => t.teamId));

  const teamedUserIds = new Set<string>();
  const teamCandidates: Candidate[] = [];
  let extraSwipedUserIds = new Set<string>();

  if (me.listingType === "HAS_ROOM") {
    // HAS_ROOM listers see NEEDS_ROOM teams of 2+ as a single combined card
    // instead of each member showing up separately.
    const teams = await prisma.team.findMany({
      where: { status: "ACTIVE" },
      include: {
        members: {
          orderBy: { joinedAt: "asc" },
          include: {
            user: {
              include: { profile: true, photos: { orderBy: { position: "asc" }, take: 1 } },
            },
          },
        },
      },
    });

    for (const team of teams) {
      if (team.members.length < 2) continue;
      if (swipedTeamIds.has(team.id)) continue;

      const memberProfiles = team.members
        .map((m) => m.user.profile)
        .filter((p): p is NonNullable<typeof p> => p !== null);
      const completeProfiles = memberProfiles.filter(isCompleteProfile);
      if (completeProfiles.length !== team.members.length) continue;
      if (!completeProfiles.every((p) => passesHardFilters(me, p))) continue;

      team.members.forEach((m) => teamedUserIds.add(m.userId));

      const { score, breakdown } = averageCompatibility(
        completeProfiles.map((p) => computeCompatibility(me, p))
      );

      teamCandidates.push({
        id: team.id,
        isTeam: true,
        members: team.members.map((m, i) => ({
          userId: m.userId,
          name: completeProfiles[i].name,
          age: completeProfiles[i].age,
          photoUrl: m.user.photos[0]?.url ?? null,
        })),
        name: formatTeamName(completeProfiles.map((p) => p.name)),
        age: null,
        bio: completeProfiles.map((p) => p.bio).find(Boolean) ?? "",
        college: completeProfiles[0].college,
        course: null,
        listingType: "NEEDS_ROOM",
        city: completeProfiles[0].city,
        preferredArea: completeProfiles[0].preferredArea,
        budgetMin: Math.min(...completeProfiles.map((p) => p.budgetMin)),
        budgetMax: Math.max(...completeProfiles.map((p) => p.budgetMax)),
        interests: [...new Set(completeProfiles.flatMap((p) => p.interests))].slice(0, 8),
        verified: completeProfiles.every((p) => p.verified),
        photoUrl: team.members[0].user.photos[0]?.url ?? null,
        compatibilityScore: score,
        compatibilityBreakdown: breakdown,
      });
    }
  } else {
    // I'm searching for a room. If I'm part of a team, don't show HAS_ROOM
    // candidates a teammate has already swiped on, so we don't re-decide.
    const myTeam = await getActiveTeamForUser(userId);
    if (myTeam && myTeam.members.length >= 2) {
      const teamSwipes = await prisma.teamLike.findMany({
        where: { teamId: myTeam.id, direction: "FROM_TEAM" },
        select: { userId: true },
      });
      extraSwipedUserIds = new Set(teamSwipes.map((t) => t.userId));
    }
  }

  const individualResults: Candidate[] = candidates
    .filter((c) => !swipedUserIds.has(c.userId))
    .filter((c) => !extraSwipedUserIds.has(c.userId))
    .filter((c) => !teamedUserIds.has(c.userId))
    .filter(isCompleteProfile)
    .filter((c) => passesHardFilters(me, c))
    .map((c) => {
      const { score, breakdown } = computeCompatibility(me, c);
      return {
        id: c.userId,
        isTeam: false,
        members: [
          { userId: c.userId, name: c.name, age: c.age, photoUrl: c.user.photos[0]?.url ?? null },
        ],
        name: c.name,
        age: c.age,
        bio: c.bio,
        college: c.college,
        course: c.course,
        listingType: c.listingType,
        city: c.city,
        preferredArea: c.preferredArea,
        budgetMin: c.budgetMin,
        budgetMax: c.budgetMax,
        interests: c.interests,
        verified: c.verified,
        photoUrl: c.user.photos[0]?.url ?? null,
        compatibilityScore: score,
        compatibilityBreakdown: breakdown,
      };
    });

  const results = [...individualResults, ...teamCandidates].sort(
    (a, b) => b.compatibilityScore - a.compatibilityScore
  );

  return NextResponse.json({ candidates: results });
}
