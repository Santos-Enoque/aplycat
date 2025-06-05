import { NextRequest, NextResponse } from "next/server";
import { getCompleteDashboardData } from "@/lib/actions/dashboard-actions";

export async function GET(request: NextRequest) {
  try {
    const userData = await getCompleteDashboardData();
    
    if (!userData) {
      return NextResponse.json(
        { error: "User not found or not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json(userData, {
      headers: {
        // Cache for 1 minute on CDN, allow stale for 5 minutes
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[API] Dashboard data fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
} 