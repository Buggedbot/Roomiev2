import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getCached, setCached, NOMINATIM_USER_AGENT } from "@/lib/geo-cache";

type NominatimResult = {
  place_id: number;
  lat: string;
  lon: string;
  address?: Record<string, string>;
};

export type CitySuggestion = {
  placeId: string;
  city: string;
  state: string;
  country: string;
  label: string;
  latitude: number;
  longitude: number;
};

const CACHE_TTL_MS = 10 * 60 * 1000;

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const cacheKey = `search:${q.toLowerCase()}`;
  const cached = getCached<CitySuggestion[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ results: cached });
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", q);
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("limit", "8");

  let data: NominatimResult[];
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": NOMINATIM_USER_AGENT, "Accept-Language": "en" },
    });
    if (!response.ok) throw new Error(`Nominatim responded ${response.status}`);
    data = await response.json();
  } catch {
    return NextResponse.json({ error: "City search is temporarily unavailable" }, { status: 502 });
  }

  const seen = new Set<string>();
  const results: CitySuggestion[] = [];
  for (const item of data) {
    const address = item.address ?? {};
    const city = address.city || address.town || address.village || address.county || address.state_district;
    const state = address.state ?? "";
    if (!city) continue;

    const dedupeKey = `${city}|${state}`.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    results.push({
      placeId: String(item.place_id),
      city,
      state,
      country: address.country ?? "India",
      label: state ? `${city}, ${state}` : city,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
    });
  }

  setCached(cacheKey, results, CACHE_TTL_MS);
  return NextResponse.json({ results });
}
