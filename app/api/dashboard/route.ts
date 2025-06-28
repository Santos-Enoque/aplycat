import { NextRequest } from "next/server";
import { createSuccessResponse, handleApiError, CommonErrors } from "@/lib/utils/api-response";
import { getCompleteDashboardData } from "@/lib/actions/dashboard-actions";

export async function GET(request: NextRequest) {
  try {
    const userData = await getCompleteDashboardData();
    
    if (!userData) {
      return CommonErrors.unauthorized();
    }

    const response = createSuccessResponse(userData);
    
    // Cache for 1 minute on CDN, allow stale for 5 minutes
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    
    return response;
  } catch (error) {
    return handleApiError(error, "DASHBOARD_DATA");
  }
} 