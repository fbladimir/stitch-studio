import { NextRequest, NextResponse } from "next/server";

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;

// Craft store keywords for text search
const CRAFT_STORE_QUERIES = [
  "craft store",
  "needlework shop",
  "cross stitch store",
  "quilting fabric store",
];

interface PlaceResult {
  name: string;
  vicinity?: string;
  formatted_address?: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  opening_hours?: { open_now?: boolean };
  place_id: string;
}

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 3959; // miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = searchParams.get("lat");
  const lng = searchParams.get("lng");

  if (!lat || !lng) {
    return NextResponse.json({ error: "Missing lat/lng" }, { status: 400 });
  }

  if (!GOOGLE_MAPS_KEY) {
    // Fallback: return empty results with a message
    return NextResponse.json({
      stores: [],
      message: "Google Maps API key not configured. Add NEXT_PUBLIC_GOOGLE_MAPS_KEY to your environment.",
    });
  }

  try {
    const allPlaces: PlaceResult[] = [];
    const seenIds = new Set<string>();

    // Search for multiple craft-related queries
    for (const query of CRAFT_STORE_QUERIES) {
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        query
      )}&location=${lat},${lng}&radius=32000&key=${GOOGLE_MAPS_KEY}`;

      const res = await fetch(url);
      if (!res.ok) continue;

      const data = await res.json();
      if (data.results) {
        for (const place of data.results) {
          if (!seenIds.has(place.place_id)) {
            seenIds.add(place.place_id);
            allPlaces.push(place);
          }
        }
      }
    }

    // Calculate distance and format
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);

    const stores = allPlaces
      .map((p) => {
        const dist = haversineDistance(
          userLat,
          userLng,
          p.geometry.location.lat,
          p.geometry.location.lng
        );
        return {
          name: p.name,
          address: p.vicinity || p.formatted_address || "",
          distance: dist < 1 ? `${Math.round(dist * 5280)} ft` : `${dist.toFixed(1)} mi`,
          distance_miles: dist,
          open_now: p.opening_hours?.open_now,
          place_id: p.place_id,
          lat: p.geometry.location.lat,
          lng: p.geometry.location.lng,
        };
      })
      .sort((a, b) => a.distance_miles - b.distance_miles)
      .slice(0, 15); // Top 15 closest

    return NextResponse.json({ stores });
  } catch (err) {
    console.error("places/nearby error:", err);
    return NextResponse.json(
      { error: "Could not search for nearby stores" },
      { status: 500 }
    );
  }
}
