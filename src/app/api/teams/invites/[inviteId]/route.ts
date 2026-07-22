import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { MAX_TEAM_SIZE, getActiveTeamForUser } from "@/lib/teams";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ inviteId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { inviteId } = await params;
  const body = await req.json().catch(() => null);
  const accept = body?.accept === true;

  const invite = await prisma.teamInvite.findUnique({
    where: { id: inviteId },
    include: { team: true },
  });
  if (!invite || invite.toUserId !== userId || invite.status !== "PENDING") {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }
  if (invite.team.status !== "ACTIVE") {
    return NextResponse.json({ error: "This team no longer exists" }, { status: 400 });
  }

  if (!accept) {
    await prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: "DECLINED", respondedAt: new Date() },
    });
    return NextResponse.json({ ok: true });
  }

  const myExistingTeam = await getActiveTeamForUser(userId);
  if (myExistingTeam) {
    return NextResponse.json({ error: "You're already in a team" }, { status: 400 });
  }

  const memberCount = await prisma.teamMember.count({ where: { teamId: invite.teamId } });
  if (memberCount >= MAX_TEAM_SIZE) {
    return NextResponse.json({ error: "Team is full" }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.teamMember.create({ data: { teamId: invite.teamId, userId } }),
    prisma.teamInvite.update({
      where: { id: inviteId },
      data: { status: "ACCEPTED", respondedAt: new Date() },
    }),
    prisma.teamInvite.updateMany({
      where: { toUserId: userId, status: "PENDING", NOT: { id: inviteId } },
      data: { status: "DECLINED", respondedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ ok: true });
}
