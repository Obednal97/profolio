import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const input = searchParams.get("input");
    const sessiontoken = searchParams.get("sessiontoken");

    if (!input) {
      return NextResponse.json(
        { error: "Input parameter is required" },
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

    // Build the Google Places API URL
    const googleApiUrl = new URL(
      "https://maps.googleapis.com/maps/api/place/autocomplete/json"
    );
    googleApiUrl.searchParams.set("input", input);
    googleApiUrl.searchParams.set("types", "address");
    googleApiUrl.searchParams.set("key", apiKey);

    if (sessiontoken) {
      googleApiUrl.searchParams.set("sessiontoken", sessiontoken);
    }

    // Call Google Places API from server-side
    const response = await fetch(googleApiUrl.toString());

    if (!response.ok) {
      throw new Error(`Google Places API error: ${response.status}`);
    }

    const data = await response.json();

    // Return the data to the frontend
    return NextResponse.json(data);
  } catch (error) {
    console.error("❌ [Google Places Proxy] Autocomplete error:", error);

    return NextResponse.json(
      {
        error: "Failed to fetch address suggestions",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
