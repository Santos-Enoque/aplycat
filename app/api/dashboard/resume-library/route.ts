import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import type { ResumeLibraryView, SortOption, ProcessingStatus } from "@/types/resume-library";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    
    // Parse query parameters
    const viewMode = searchParams.get("viewMode") || "grid";
    const sortBy = (searchParams.get("sortBy") || "dateUploaded") as SortOption;
    const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
    const searchQuery = searchParams.get("searchQuery") || "";
    
    // Parse filters
    const status = searchParams.get("status")?.split(",").filter(Boolean) as ProcessingStatus[] || [];
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    const hasAnalysis = searchParams.get("hasAnalysis");
    const hasImprovements = searchParams.get("hasImprovements");
    const tags = searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const scoreMin = searchParams.get("scoreMin");
    const scoreMax = searchParams.get("scoreMax");

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Build where clause
    const where: Prisma.ResumeWhereInput = {
      userId: user.id,
      isActive: true,
    };

    // Search query
    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: "insensitive" } },
        { fileName: { contains: searchQuery, mode: "insensitive" } },
        { description: { contains: searchQuery, mode: "insensitive" } },
      ];
    }

    // Date range filter
    if (dateFrom && dateTo) {
      where.createdAt = {
        gte: new Date(dateFrom),
        lte: new Date(dateTo),
      };
    }

    // Has analysis filter
    if (hasAnalysis === "true") {
      where.analyses = { some: { isCompleted: true } };
    }

    // Has improvements filter
    if (hasImprovements === "true") {
      where.improvements = { some: { isCompleted: true } };
    }

    // Tags filter (for future implementation)
    if (tags.length > 0) {
      where.tags = { some: { name: { in: tags } } };
    }

    // Build orderBy
    let orderBy: Prisma.ResumeOrderByWithRelationInput = {};
    
    switch (sortBy) {
      case "dateUploaded":
        orderBy = { createdAt: sortOrder };
        break;
      case "lastModified":
        orderBy = { updatedAt: sortOrder };
        break;
      case "title":
        orderBy = { title: sortOrder };
        break;
      case "analysisScore":
        // This requires a more complex query
        orderBy = { createdAt: sortOrder }; // Fallback for now
        break;
      case "mostAnalyzed":
      case "mostImproved":
        // These require aggregation queries
        orderBy = { createdAt: sortOrder }; // Fallback for now
        break;
      default:
        orderBy = { createdAt: sortOrder };
    }

    // Fetch resumes with relations
    const resumes = await db.resume.findMany({
      where,
      orderBy,
      include: {
        analyses: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        improvements: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        improvedResumes: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        tags: true,
        analytics: true,
        _count: {
          select: {
            analyses: true,
            improvements: true,
            improvedResumes: true,
          },
        },
      },
    });

    // Apply score range filter (post-query filtering)
    let filteredResumes = resumes;
    if (scoreMin || scoreMax) {
      filteredResumes = resumes.filter((resume) => {
        const score = resume.analyses[0]?.atsScore;
        if (score === undefined) return false;
        
        const minCheck = scoreMin ? score >= parseInt(scoreMin) : true;
        const maxCheck = scoreMax ? score <= parseInt(scoreMax) : true;
        
        return minCheck && maxCheck;
      });
    }

    // Calculate statistics
    const statistics = {
      totalResumes: filteredResumes.length,
      totalAnalyses: filteredResumes.reduce((acc, r) => acc + r._count.analyses, 0),
      totalImprovements: filteredResumes.reduce((acc, r) => acc + r._count.improvements, 0),
      averageScore: Math.round(
        filteredResumes
          .map(r => r.analyses[0]?.atsScore)
          .filter(Boolean)
          .reduce((acc, score, _, arr) => acc + (score || 0) / arr.length, 0)
      ),
      recentActivity: {
        uploaded: filteredResumes.filter(r => 
          new Date(r.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        analyzed: filteredResumes.filter(r => 
          r.analyses.some(a => 
            new Date(a.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          )
        ).length,
        improved: filteredResumes.filter(r => 
          r.improvements.some(i => 
            new Date(i.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          )
        ).length,
      },
    };

    return NextResponse.json({
      success: true,
      resumes: filteredResumes,
      statistics,
      totalCount: filteredResumes.length,
    });
  } catch (error) {
    console.error("[RESUME_LIBRARY_API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}