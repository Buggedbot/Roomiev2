import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { setSessionCookie } from "@/lib/auth";

const GOOGLE_STATE_COOKIE = "google_oauth_state";

type GoogleTokenResponse = {
  access_token?: string;
};

type GoogleProfile = {
  sub?: string;
  email?: string;
  email_verified?: boolean;
};

function getAppUrl(request: NextRequest) {
  return process.env.APP_URL ?? request.nextUrl.origin;
}

function loginErrorResponse(request: NextRequest) {
  const url = new URL("/login", getAppUrl(request));
  url.searchParams.set("error", "google_signin_failed");
  const response = NextResponse.redirect(url);
  response.cookies.delete(GOOGLE_STATE_COOKIE);
  return response;
}

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const storedState = request.cookies.get(GOOGLE_STATE_COOKIE)?.value;
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!code || !state || !storedState || state !== storedState || !clientId || !clientSecret) {
    return loginErrorResponse(request);
  }

  const redirectUri = new URL("/api/auth/google/callback", getAppUrl(request)).toString();
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
    cache: "no-store",
  });
  const tokens = (await tokenResponse.json().catch(() => ({}))) as GoogleTokenResponse;

  if (!tokenResponse.ok || !tokens.access_token) {
    return loginErrorResponse(request);
  }

  const profileResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
    cache: "no-store",
  });
  const profile = (await profileResponse.json().catch(() => ({}))) as GoogleProfile;

  if (!profileResponse.ok || !profile.sub || !profile.email || !profile.email_verified) {
    return loginErrorResponse(request);
  }

  const email = profile.email.toLowerCase();
  let user = await prisma.user.findUnique({ where: { googleId: profile.sub } });

  if (!user) {
    const emailUser = await prisma.user.findUnique({ where: { email } });
    user = emailUser
      ? await prisma.user.update({
          where: { id: emailUser.id },
          data: { googleId: profile.sub, emailVerified: true },
        })
      : await prisma.user.create({
          data: { email, googleId: profile.sub, emailVerified: true },
        });
  }

  const profileRecord = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { isComplete: true },
  });

  await setSessionCookie(user.id);

  const url = new URL(profileRecord?.isComplete ? "/discover" : "/profile/setup", getAppUrl(request));
  const response = NextResponse.redirect(url);
  response.cookies.delete(GOOGLE_STATE_COOKIE);
  return response;
}
