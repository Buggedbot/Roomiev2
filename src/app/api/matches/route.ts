import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matches = await prisma.match.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    orderBy: { createdAt: "desc" },
    include: {
      userA: { include: { profile: true } },
      userB: { include: { profile: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const result = matches.map((m) => {
    const other = m.userAId === userId ? m.userB : m.userA;
    return {
      matchId: m.id,
      createdAt: m.createdAt,
      otherUser: {
        id: other.id,
        name: other.profile?.name ?? "Unknown",
      },
      lastMessage: m.messages[0]
        ? { content: m.messages[0].content, createdAt: m.messages[0].createdAt }
        : null,
    };
  });

  return NextResponse.json({ matches: result });
}
