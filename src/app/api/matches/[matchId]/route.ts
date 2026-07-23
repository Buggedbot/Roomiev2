import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { assertParticipant } from "@/lib/matches";
import { formatTeamName } from "@/lib/teams";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await params;
  const membership = await assertParticipant(matchId, userId);
  if (!membership) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      userA: { include: { profile: true, photos: { orderBy: { position: "asc" }, take: 1 } } },
      userB: { include: { profile: true, photos: { orderBy: { position: "asc" }, take: 1 } } },
      team: {
        include: {
          members: {
            orderBy: { joinedAt: "asc" },
            include: {
              user: { include: { profile: true, photos: { orderBy: { position: "asc" }, take: 1 } } },
            },
          },
        },
      },
    },
  });
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // `participants` lists everyone else in the chat besides me, used to
  // attribute sender names on message bubbles in group (team) matches.
  let participants: { id: string; name: string; photoUrl: string | null }[];
  let headerName: string;
  let headerPhotoUrl: string | null;
  let isGroup: boolean;

  if (match.team) {
    const iAmInTeam = match.team.members.some((m) => m.userId === userId);
    if (iAmInTeam) {
      participants = [
        { id: match.userA.id, name: match.userA.profile?.name ?? "Unknown", photoUrl: match.userA.photos[0]?.url ?? null },
        ...match.team.members
          .filter((m) => m.userId !== userId)
          .map((m) => ({
            id: m.userId,
            name: m.user.profile?.name ?? "Someone",
            photoUrl: m.user.photos[0]?.url ?? null,
          })),
      ];
      headerName = match.userA.profile?.name ?? "Unknown";
      headerPhotoUrl = match.userA.photos[0]?.url ?? null;
    } else {
      participants = match.team.members.map((m) => ({
        id: m.userId,
        name: m.user.profile?.name ?? "Someone",
        photoUrl: m.user.photos[0]?.url ?? null,
      }));
      headerName = formatTeamName(match.team.members.map((m) => m.user.profile?.name ?? "Someone"));
      headerPhotoUrl = match.team.members[0]?.user.photos[0]?.url ?? null;
    }
    isGroup = match.team.members.length + 1 > 2;
  } else {
    const other = match.userAId === userId ? match.userB : match.userA;
    if (!other) {
      return NextResponse.json({ error: "Match is no longer available" }, { status: 404 });
    }
    participants = [{ id: other.id, name: other.profile?.name ?? "Unknown", photoUrl: other.photos[0]?.url ?? null }];
    headerName = other.profile?.name ?? "Unknown";
    headerPhotoUrl = other.photos[0]?.url ?? null;
    isGroup = false;
  }

  return NextResponse.json({
    matchId: match.id,
    isGroup,
    headerName,
    headerPhotoUrl,
    participants,
    // Kept for compatibility with the single-recipient case.
    otherUser: { id: participants[0]?.id, name: headerName, photoUrl: headerPhotoUrl },
  });
}
