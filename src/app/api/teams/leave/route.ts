import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { getActiveTeamForUser } from "@/lib/teams";

export async function POST() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const team = await getActiveTeamForUser(userId);
  if (!team) {
    return NextResponse.json({ error: "You're not in a team" }, { status: 400 });
  }

  if (team.captainId === userId) {
    // The captain leaving disbands the team for everyone rather than
    // reassigning captaincy — keeps the permission model simple.
    await prisma.$transaction([
      prisma.teamMember.deleteMany({ where: { teamId: team.id } }),
      prisma.teamInvite.updateMany({
        where: { teamId: team.id, status: "PENDING" },
        data: { status: "DECLINED", respondedAt: new Date() },
      }),
      prisma.team.update({ where: { id: team.id }, data: { status: "DISBANDED" } }),
    ]);
  } else {
    await prisma.teamMember.delete({ where: { teamId_userId: { teamId: team.id, userId } } });
  }

  return NextResponse.json({ ok: true });
}
