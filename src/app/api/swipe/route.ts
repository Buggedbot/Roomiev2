import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { swipeSchema } from "@/lib/validation";
import { getActiveTeamForUser } from "@/lib/teams";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = swipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { toUserId, toTeamId, action } = parsed.data;
  const isLike = action === "LIKE" || action === "SUPER_LIKE";

  // Swiping on a team card: I'm a HAS_ROOM user liking/passing a whole team at once.
  if (toTeamId) {
    const [team, ownMembership] = await Promise.all([
      prisma.team.findUnique({ where: { id: toTeamId } }),
      prisma.teamMember.findUnique({ where: { teamId_userId: { teamId: toTeamId, userId } } }),
    ]);
    if (!team || team.status !== "ACTIVE") {
      return NextResponse.json({ error: "Team not found" }, { status: 404 });
    }
    if (ownMembership) {
      return NextResponse.json({ error: "Cannot swipe on your own team" }, { status: 400 });
    }

    await prisma.teamLike.upsert({
      where: { teamId_userId_direction: { teamId: toTeamId, userId, direction: "FROM_USER" } },
      create: { teamId: toTeamId, userId, direction: "FROM_USER", action },
      update: { action },
    });

    let matched = false;
    let matchId: string | null = null;

    if (isLike) {
      const reciprocal = await prisma.teamLike.findUnique({
        where: { teamId_userId_direction: { teamId: toTeamId, userId, direction: "FROM_TEAM" } },
      });
      if (reciprocal && reciprocal.action !== "PASS") {
        const match = await prisma.match.upsert({
          where: { userAId_teamId: { userAId: userId, teamId: toTeamId } },
          create: { userAId: userId, teamId: toTeamId },
          update: {},
        });
        matched = true;
        matchId = match.id;
      }
    }

    return NextResponse.json({ matched, matchId });
  }

  const targetUserId = toUserId as string;
  if (targetUserId === userId) {
    return NextResponse.json({ error: "Cannot swipe on yourself" }, { status: 400 });
  }

  // If I'm searching as part of a team and the person I'm swiping on already has a
  // room, this swipe is made on behalf of the whole team rather than just me.
  const targetProfile = await prisma.profile.findUnique({ where: { userId: targetUserId } });
  const myTeam =
    targetProfile?.listingType === "HAS_ROOM" ? await getActiveTeamForUser(userId) : null;

  if (myTeam && myTeam.members.length >= 2) {
    await prisma.teamLike.upsert({
      where: {
        teamId_userId_direction: { teamId: myTeam.id, userId: targetUserId, direction: "FROM_TEAM" },
      },
      create: { teamId: myTeam.id, userId: targetUserId, direction: "FROM_TEAM", action },
      update: { action },
    });

    let matched = false;
    let matchId: string | null = null;

    if (isLike) {
      const reciprocal = await prisma.teamLike.findUnique({
        where: {
          teamId_userId_direction: { teamId: myTeam.id, userId: targetUserId, direction: "FROM_USER" },
        },
      });
      if (reciprocal && reciprocal.action !== "PASS") {
        const match = await prisma.match.upsert({
          where: { userAId_teamId: { userAId: targetUserId, teamId: myTeam.id } },
          create: { userAId: targetUserId, teamId: myTeam.id },
          update: {},
        });
        matched = true;
        matchId = match.id;
      }
    }

    return NextResponse.json({ matched, matchId });
  }

  await prisma.like.upsert({
    where: { fromUserId_toUserId: { fromUserId: userId, toUserId: targetUserId } },
    create: { fromUserId: userId, toUserId: targetUserId, action },
    update: { action },
  });

  let matched = false;
  let matchId: string | null = null;

  if (isLike) {
    const reciprocal = await prisma.like.findUnique({
      where: { fromUserId_toUserId: { fromUserId: targetUserId, toUserId: userId } },
    });

    if (reciprocal && reciprocal.action !== "PASS") {
      const [userAId, userBId] = [userId, targetUserId].sort();
      const match = await prisma.match.upsert({
        where: { userAId_userBId: { userAId, userBId } },
        create: { userAId, userBId },
        update: {},
      });
      matched = true;
      matchId = match.id;
    }
  }

  return NextResponse.json({ matched, matchId });
}
