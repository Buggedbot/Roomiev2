import { NextRequest, NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth";

const MAX_PHOTOS = 6;
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const photos = await prisma.photo.findMany({
    where: { userId },
    orderBy: { position: "asc" },
  });

  return NextResponse.json({ photos });
}

export async function POST(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json(
      { error: "Image must be under 5MB" },
      { status: 400 }
    );
  }

  const existingCount = await prisma.photo.count({ where: { userId } });
  if (existingCount >= MAX_PHOTOS) {
    return NextResponse.json(
      { error: `You can upload up to ${MAX_PHOTOS} photos` },
      { status: 400 }
    );
  }

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";

  let blobUrl: string;
  try {
    const blob = await put(`photos/${userId}/${crypto.randomUUID()}.${extension}`, file, {
      access: "public",
    });
    blobUrl = blob.url;
  } catch {
    return NextResponse.json(
      { error: "Photo storage isn't configured for this deployment yet" },
      { status: 503 }
    );
  }

  const photo = await prisma.photo.create({
    data: { userId, url: blobUrl, position: existingCount },
  });

  return NextResponse.json({ photo }, { status: 201 });
}
