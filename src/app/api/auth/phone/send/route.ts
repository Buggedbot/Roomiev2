import { NextRequest, NextResponse } from "next/server";
import { isTwilioVerifyConfigured, sendPhoneVerification } from "@/lib/twilio-verify";
import { phoneSchema } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = phoneSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid phone number" },
      { status: 400 }
    );
  }

  if (!isTwilioVerifyConfigured()) {
    return NextResponse.json({ error: "Phone sign-in is not configured yet" }, { status: 503 });
  }

  try {
    await sendPhoneVerification(parsed.data.phone);
    return NextResponse.json({ message: "Verification code sent" });
  } catch {
    return NextResponse.json(
      { error: "We could not send a verification code. Please try again." },
      { status: 502 }
    );
  }
}
