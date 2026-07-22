import { NextRequest, NextResponse } from "next/server";
import { setSessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkPhoneVerification, isTwilioVerifyConfigured } from "@/lib/twilio-verify";
import { phoneVerificationSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = phoneVerificationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid verification details" },
      { status: 400 }
    );
  }

  if (!isTwilioVerifyConfigured()) {
    return NextResponse.json({ error: "Phone sign-in is not configured yet" }, { status: 503 });
  }

  try {
    const verification = await checkPhoneVerification(parsed.data.phone, parsed.data.code);
    if (verification.status !== "approved") {
      return NextResponse.json({ error: "That verification code is incorrect or expired" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({ where: { phone: parsed.data.phone } });
    if (!user) {
      user = await prisma.user.create({
        data: { phone: parsed.data.phone, phoneVerified: true },
      });
    } else if (!user.phoneVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: true },
      });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: user.id },
      select: { isComplete: true },
    });

    await setSessionCookie(user.id);
    return NextResponse.json({
      redirectTo: profile?.isComplete ? "/discover" : "/profile/setup",
    });
  } catch {
    return NextResponse.json(
      { error: "We could not verify that code. Please try again." },
      { status: 502 }
    );
  }
}
