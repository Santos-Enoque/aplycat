import { NextRequest } from "next/server";
import { createSuccessResponse, handleApiError, CommonErrors, validateRequiredFields } from "@/lib/utils/api-response";
import { requireAuth, deductCredits } from "@/lib/middleware/auth";

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();
    
    // Validate required fields
    const missingFields = validateRequiredFields(body, ['creditsToUse', 'action']);
    if (missingFields.length > 0) {
      return CommonErrors.missingFields(missingFields);
    }

    const { creditsToUse, action } = body;

    // Validate credits amount
    if (typeof creditsToUse !== "number" || creditsToUse <= 0) {
      return CommonErrors.invalidInput("Credits amount must be a positive number");
    }

    // Validate action description
    if (typeof action !== "string" || action.trim().length === 0) {
      return CommonErrors.invalidInput("Action description must be a non-empty string");
    }

    // Deduct credits using centralized function
    const result = await deductCredits(
      user.id,
      creditsToUse,
      action
    );

    return createSuccessResponse({
      creditsUsed: creditsToUse,
      remainingCredits: result.remainingCredits,
      description: action,
    });

  } catch (error) {
    return handleApiError(error, "USE_CREDITS");
  }
} 