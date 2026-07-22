import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getCached, setCached, NOMINATIM_USER_AGENT } from "@/lib/geo-cache";

const CACHE_TTL_MS = 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const lat = req.nextUrl.searchParams.get("lat");
  const lon = req.nextUrl.searchParams.get("lon");
  const latitude = Number(lat);
  const longitude = Number(lon);
  if (!lat || !lon || Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const cacheKey = `reverse:${latitude.toFixed(3)},${longitude.toFixed(3)}`;
  const cached = getCached<{ city: string; state: string; country: string }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(latitude));
  url.searchParams.set("lon", String(longitude));
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");

  let data: { address?: Record<string, string> };
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT, "Accept-Language": "en" },
    });
    if (!response.ok) throw new Error(`Nominatim responded ${response.status}`);
    data = await response.json();
  } catch {
    return NextResponse.json({ error: "Unable to determine your location" }, { status: 502 });
  }

  const address = data.address ?? {};
  const city = address.city || address.town || address.village || address.county || address.state_district;
  if (!city) {
    return NextResponse.json({ error: "Unable to determine your location" }, { status: 404 });
  }

  const result = {
    city,
    state: address.state ?? "",
    country: address.country ?? "India",
  };
  setCached(cacheKey, result, CACHE_TTL_MS);
  return NextResponse.json(result);
}
