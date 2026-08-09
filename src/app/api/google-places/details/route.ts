import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const placeId = searchParams.get("place_id");
    const fields =
      searchParams.get("fields") || "address_components,formatted_address";

    if (!placeId) {
      return NextResponse.json(
        { error: "place_id parameter is required" },
        { status: 400 }
      );
    }

    // Get API key from environment or request headers
    const apiKey =
      process.env.GOOGLE_PLACES_API_KEY ||
      request.headers.get("x-google-api-key");

    if (!apiKey) {
      return NextResponse.json(
        { error: "Google Places API key not configured" },
        { status: 500 }
      );
    }

    // Build the Google Places Details API URL
    const googleApiUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/details/json"
    );
    googleApiUrl.searchParams.set("place_id", placeId);
    googleApiUrl.searchParams.set("fields", fields);
    googleApiUrl.searchParams.set("key", apiKey);

    // Call Google Places API from server-side
    const response = await fetch(googleApiUrl.toString());

    if (!response.ok) {
      throw new Error(`Google Places Details API error: ${response.status}`);
    }

    const data = await response.json();

    // Return the data to the frontend
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [Google Places Proxy] Details error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch place details",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
