import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { MAX_TEAM_SIZE, getActiveTeamForUser, serializeTeam, teamInclude } from "@/lib/teams";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [profile, team, pendingInvites] = await Promise.all([
    prisma.profile.findUnique({ where: { userId } }),
    getActiveTeamForUser(userId),
    prisma.teamInvite.findMany({
      where: { toUserId: userId, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      include: { team: { include: teamInclude } },
    }),
  ]);

  const isCaptain = team?.captainId === userId;

  const invitableMatches: { userId: string; name: string; photoUrl: string | null }[] = [];
  if (team && isCaptain && team.members.length < MAX_TEAM_SIZE) {
    const matches = await prisma.match.findMany({
      where: { teamId: null, OR: [{ userAId: userId }, { userBId: userId }] },
      include: {
        userA: { include: { profile: true, photos: { orderBy: { position: "asc" }, take: 1 } } },
        userB: { include: { profile: true, photos: { orderBy: { position: "asc" }, take: 1 } } },
      },
    });

    const teamMemberIds = new Set(team.members.map((m) => m.userId));
    const alreadyInvited = await prisma.teamInvite.findMany({
      where: { teamId: team.id, status: "PENDING" },
      select: { toUserId: true },
    });
    const alreadyInvitedIds = new Set(alreadyInvited.map((i) => i.toUserId));

    for (const m of matches) {
      const other = m.userAId === userId ? m.userB : m.userA;
      if (!other?.profile) continue;
      if (teamMemberIds.has(other.id) || alreadyInvitedIds.has(other.id)) continue;
      if (other.profile.listingType !== "NEEDS_ROOM" || !other.profile.isComplete) continue;
      const theirTeam = await getActiveTeamForUser(other.id);
      if (theirTeam) continue;
      invitableMatches.push({
        userId: other.id,
        name: other.profile.name ?? "Unknown",
        photoUrl: other.photos[0]?.url ?? null,
      });
    }
  }

  return NextResponse.json({
    listingType: profile?.listingType ?? null,
    team: team ? serializeTeam(team) : null,
    isCaptain,
    pendingInvites: pendingInvites.map((invite) => ({
      id: invite.id,
      team: serializeTeam(invite.team),
    })),
    invitableMatches,
  });
}

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.profile.findUnique({ where: { userId } });
  if (!profile || profile.listingType !== "NEEDS_ROOM") {
    return NextResponse.json(
      { error: "Only people looking for a room can create a team" },
      { status: 400 }
    );
  }

  const existing = await getActiveTeamForUser(userId);
  if (existing) {
    return NextResponse.json({ error: "You're already in a team" }, { status: 400 });
  }

  const team = await prisma.team.create({
    data: { captainId: userId, members: { create: { userId } } },
    include: teamInclude,
  });

  return NextResponse.json({ team: serializeTeam(team) }, { status: 201 });
}
