import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { swipeSchema } from "@/lib/validation";

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

  const { toUserId, action } = parsed.data;
  if (toUserId === userId) {
    return NextResponse.json({ error: "Cannot swipe on yourself" }, { status: 400 });
  }

  await prisma.like.upsert({
    where: { fromUserId_toUserId: { fromUserId: userId, toUserId } },
    create: { fromUserId: userId, toUserId, action },
    update: { action },
  });

  let matched = false;
  let matchId: string | null = null;

  if (action === "LIKE" || action === "SUPER_LIKE") {
    const reciprocal = await prisma.like.findUnique({
      where: { fromUserId_toUserId: { fromUserId: toUserId, toUserId: userId } },
    });

    if (reciprocal && reciprocal.action !== "PASS") {
      const [userAId, userBId] = [userId, toUserId].sort();
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
