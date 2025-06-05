import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserFromDB } from "@/lib/auth/user-sync";
import { deductUserCredits, checkUserCredits } from "@/lib/actions/user-actions";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUserFromDB();
    
    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { creditsToUse, action } = body;

    if (!creditsToUse || typeof creditsToUse !== "number" || creditsToUse <= 0) {
      return NextResponse.json(
        { error: "Invalid credits amount" },
        { status: 400 }
      );
    }

    if (!action || typeof action !== "string") {
      return NextResponse.json(
        { error: "Action description is required" },
        { status: 400 }
      );
    }

    // Check if user has enough credits
    const hasEnoughCredits = await checkUserCredits(creditsToUse);
    
    if (!hasEnoughCredits) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 400 }
      );
    }

    // Deduct credits
    const success = await deductUserCredits(
      creditsToUse,
      action,
      'IMPROVEMENT_USE' // Using IMPROVEMENT_USE as a general category for feature usage
    );

    if (!success) {
      return NextResponse.json(
        { error: "Failed to deduct credits" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      creditsUsed: creditsToUse,
      description: action,
    });

  } catch (error) {
    console.error("[USE_CREDITS] Error processing credit transaction:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 