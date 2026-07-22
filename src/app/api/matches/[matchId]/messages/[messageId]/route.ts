import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { assertParticipant } from "@/lib/matches";
import { editMessageSchema } from "@/lib/validation";
import { publish } from "@/lib/chat-realtime";

async function loadOwnMessage(matchId: string, messageId: string, userId: string) {
  const message = await prisma.message.findUnique({ where: { id: messageId } });
  if (!message || message.matchId !== matchId || message.senderId !== userId) return null;
  if (message.deletedAt) return null;
  return message;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string; messageId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId, messageId } = await params;
  const match = await assertParticipant(matchId, userId);
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await loadOwnMessage(matchId, messageId, userId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = editMessageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const message = await prisma.message.update({
    where: { id: messageId },
    data: { content: parsed.data.content, editedAt: new Date() },
  });

  publish(matchId, { type: "edit", message });

  return NextResponse.json({ message });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ matchId: string; messageId: string }> }
) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { matchId, messageId } = await params;
  const match = await assertParticipant(matchId, userId);
  if (!match) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const existing = await loadOwnMessage(matchId, messageId, userId);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.message.update({
    where: { id: messageId },
    data: { deletedAt: new Date() },
  });

  publish(matchId, { type: "delete", messageId });

  return NextResponse.json({ ok: true });
}
