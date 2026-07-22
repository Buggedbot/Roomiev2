import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { formatTeamName } from "@/lib/teams";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { userAId: userId },
        { userBId: userId },
        { team: { members: { some: { userId } } } },
      ],
    },
    orderBy: { createdAt: "desc" },
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
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const unreadCounts = await prisma.message.groupBy({
    by: ["matchId"],
    where: {
      matchId: { in: matches.map((m) => m.id) },
      senderId: { not: userId },
      readAt: null,
      deletedAt: null,
    },
    _count: { _all: true },
  });
  const unreadByMatch = new Map(unreadCounts.map((u) => [u.matchId, u._count._all]));

  const result = matches.map((m) => {
    const lastMessage = m.messages[0];
    let otherUser: { id: string; name: string; photoUrl: string | null; isTeam: boolean };

    if (m.team) {
      const iAmInTeam = m.team.members.some((mem) => mem.userId === userId);
      if (iAmInTeam) {
        otherUser = {
          id: m.userA.id,
          name: m.userA.profile?.name ?? "Unknown",
          photoUrl: m.userA.photos[0]?.url ?? null,
          isTeam: false,
        };
      } else {
        otherUser = {
          id: m.team.id,
          name: formatTeamName(m.team.members.map((mem) => mem.user.profile?.name ?? "Someone")),
          photoUrl: m.team.members[0]?.user.photos[0]?.url ?? null,
          isTeam: true,
        };
      }
    } else {
      const other = m.userAId === userId ? m.userB! : m.userA;
      otherUser = {
        id: other.id,
        name: other.profile?.name ?? "Unknown",
        photoUrl: other.photos[0]?.url ?? null,
        isTeam: false,
      };
    }

    return {
      matchId: m.id,
      createdAt: m.createdAt,
      otherUser,
      lastMessage: lastMessage
        ? {
            content: lastMessage.deletedAt
              ? "Message deleted"
              : lastMessage.imageUrl && !lastMessage.content
                ? "📷 Photo"
                : lastMessage.content,
            createdAt: lastMessage.createdAt,
          }
        : null,
      unreadCount: unreadByMatch.get(m.id) ?? 0,
    };
  });

  return NextResponse.json({ matches: result });
}
