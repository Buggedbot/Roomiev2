import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";
import { assertParticipant } from "@/lib/matches";
import { publish } from "@/lib/chat-realtime";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(
  req: NextRequest,
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

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, or WEBP images are allowed" },
      { status: 400 }
    );
  }

  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Image must be under 5MB" }, { status: 400 });
  }

  const caption = formData?.get("caption");

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

  let blobUrl: string;
  try {
    const blob = await put(`chat/${matchId}/${crypto.randomUUID()}.${extension}`, file, {
      access: "public",
    });
    blobUrl = blob.url;
  } catch {
    return NextResponse.json(
      { error: "Image storage isn't configured for this deployment yet" },
      { status: 503 }
    );
  }

  const message = await prisma.message.create({
    data: {
      matchId,
      senderId: userId,
      content: typeof caption === "string" ? caption.trim() : "",
      imageUrl: blobUrl,
    },
  });

  publish(matchId, { type: "message", message });

  return NextResponse.json({ message }, { status: 201 });
}
