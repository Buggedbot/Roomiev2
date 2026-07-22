import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { assertParticipant } from "@/lib/matches";
import { publish } from "@/lib/chat-realtime";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId } = await params;
  const match = await assertParticipant(matchId, userId);
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  publish(matchId, { type: "typing", userId });
  return NextResponse.json({ ok: true });
}
