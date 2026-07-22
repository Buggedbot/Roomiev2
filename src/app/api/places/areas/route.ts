import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/auth";
import { getCached, setCached, NOMINATIM_USER_AGENT } from "@/lib/geo-cache";
import { getCuratedAreas } from "@/lib/indian-locations";

const CACHE_TTL_MS = 60 * 60 * 1000;

type OverpassElement = { tags?: { name?: string } };

async function fetchOverpassAreas(city: string): Promise<string[]> {
  const geocodeUrl = new URL("https://nominatim.openstreetmap.org/search");
  geocodeUrl.searchParams.set("q", city);
  geocodeUrl.searchParams.set("countrycodes", "in");
  geocodeUrl.searchParams.set("format", "jsonv2");
  geocodeUrl.searchParams.set("limit", "1");

  const geocodeRes = await fetch(geocodeUrl, {
    headers: { "User-Agent": NOMINATIM_USER_AGENT, "Accept-Language": "en" },
  });
  if (!geocodeRes.ok) return [];
  const geocodeData: Array<{ boundingbox: [string, string, string, string] }> = await geocodeRes.json();
  const bbox = geocodeData[0]?.boundingbox;
  if (!bbox) return [];

  const [south, north, west, east] = bbox.map(Number);
  const query = `[out:json][timeout:15];(node["place"~"^(suburb|neighbourhood|quarter)$"](${south},${west},${north},${east}););out body 40;`;

  const overpassRes = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    headers: { "User-Agent": NOMINATIM_USER_AGENT, "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });
  if (!overpassRes.ok) return [];
  const overpassData: { elements: OverpassElement[] } = await overpassRes.json();

  const names = overpassData.elements
    .map((element) => element.tags?.name)
    .filter((name): name is string => Boolean(name));
  return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
}

export async function GET(req: NextRequest) {
  const userId = await getCurrentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const city = req.nextUrl.searchParams.get("city")?.trim() ?? "";
  if (!city) {
    return NextResponse.json({ areas: [], source: "none" });
  }

  const curated = getCuratedAreas(city);
  if (curated) {
    return NextResponse.json({ areas: curated, source: "curated" });
  }

  const cacheKey = `areas:${city.toLowerCase()}`;
  const cached = getCached<string[]>(cacheKey);
  if (cached) {
    return NextResponse.json({ areas: cached, source: "osm" });
  }

  let areas: string[] = [];
  try {
    areas = await fetchOverpassAreas(city);
  } catch {
    return NextResponse.json({ error: "Unable to load nearby areas" }, { status: 502 });
  }

  setCached(cacheKey, areas, CACHE_TTL_MS);
  return NextResponse.json({ areas, source: "osm" });
}
