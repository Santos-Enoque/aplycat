import { NextRequest, NextResponse } from "next/server";
import { getUserAnalyses } from "@/lib/actions/resume-actions";

export async function GET(request: NextRequest) {
  try {
    const result = await getUserAnalyses();
    
    if (!result) {
      return NextResponse.json(
        { error: "Failed to fetch analyses" },
        { status: 500 }
      );
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[API] Analyses fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analyses" },
      { status: 500 }
    );
  }
} 