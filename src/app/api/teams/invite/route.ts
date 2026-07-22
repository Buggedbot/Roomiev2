import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { MAX_TEAM_SIZE, getActiveTeamForUser } from "@/lib/teams";

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const toUserId = typeof body?.toUserId === "string" ? body.toUserId : null;
  if (!toUserId) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (toUserId === userId) {
    return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 });
  }

  const team = await getActiveTeamForUser(userId);
  if (!team || team.captainId !== userId) {
    return NextResponse.json({ error: "Only the team captain can invite" }, { status: 403 });
  }
  if (team.members.length >= MAX_TEAM_SIZE) {
    return NextResponse.json({ error: "Team is full" }, { status: 400 });
  }
  if (team.members.some((m) => m.userId === toUserId)) {
    return NextResponse.json({ error: "Already a team member" }, { status: 400 });
  }

  const [userAId, userBId] = [userId, toUserId].sort();
  const existingMatch = await prisma.match.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
  });
  if (!existingMatch) {
    return NextResponse.json(
      { error: "You can only invite people you've matched with" },
      { status: 400 }
    );
  }

  const toProfile = await prisma.profile.findUnique({ where: { userId: toUserId } });
  if (!toProfile?.isComplete || toProfile.listingType !== "NEEDS_ROOM") {
    return NextResponse.json({ error: "This person isn't looking for a room" }, { status: 400 });
  }

  const theirTeam = await getActiveTeamForUser(toUserId);
  if (theirTeam) {
    return NextResponse.json({ error: "This person is already in a team" }, { status: 400 });
  }

  const invite = await prisma.teamInvite.upsert({
    where: { teamId_toUserId: { teamId: team.id, toUserId } },
    create: { teamId: team.id, toUserId, status: "PENDING" },
    update: { status: "PENDING", respondedAt: null },
  });

  return NextResponse.json({ invite }, { status: 201 });
}
