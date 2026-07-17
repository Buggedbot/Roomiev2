import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await params;
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      userA: { include: { profile: true, photos: { orderBy: { position: "asc" }, take: 1 } } },
      userB: { include: { profile: true, photos: { orderBy: { position: "asc" }, take: 1 } } },
    },
  });

  if (!match || (match.userAId !== userId && match.userBId !== userId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const other = match.userAId === userId ? match.userB : match.userA;

  return NextResponse.json({
    matchId: match.id,
    otherUser: {
      id: other.id,
      name: other.profile?.name ?? "Unknown",
      college: other.profile?.college ?? "",
      photoUrl: other.photos[0]?.url ?? null,
    },
  });
}
