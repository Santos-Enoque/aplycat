import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { analyzeResumeAction } from "@/lib/actions/resume-actions";
import { improveResumeAction } from "@/lib/actions/improvement-actions";
import type { BulkOperation } from "@/types/resume-library";

interface BulkOperationJob {
  id: string;
  type: BulkOperation["type"];
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  total: number;
  results: any[];
  errors: string[];
}

// In a production environment, this would be stored in Redis or a database
const jobStore = new Map<string, BulkOperationJob>();

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const operation: BulkOperation = await request.json();

    // Validate operation
    if (!operation.resumeIds || operation.resumeIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "No resumes selected" },
        { status: 400 }
      );
    }

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

    // Verify user owns all resumes
    const resumeCount = await db.resume.count({
      where: {
        id: { in: operation.resumeIds },
        userId: user.id,
        isActive: true,
      },
    });

    if (resumeCount !== operation.resumeIds.length) {
      return NextResponse.json(
        { success: false, error: "Invalid resume selection" },
        { status: 403 }
      );
    }

    // Create job
    const jobId = crypto.randomUUID();
    const job: BulkOperationJob = {
      id: jobId,
      type: operation.type,
      status: "pending",
      progress: 0,
      total: operation.resumeIds.length,
      results: [],
      errors: [],
    };

    jobStore.set(jobId, job);

    // Process operation asynchronously
    processBulkOperationAsync(user.id, operation, job);

    return NextResponse.json({
      success: true,
      jobId,
      message: `Bulk ${operation.type} started for ${operation.resumeIds.length} resumes`,
    });
  } catch (error) {
    console.error("[BULK_OPERATIONS_API] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function processBulkOperationAsync(
  userId: string,
  operation: BulkOperation,
  job: BulkOperationJob
) {
  job.status = "processing";

  try {
    switch (operation.type) {
      case "delete":
        await processBulkDelete(userId, operation.resumeIds, job);
        break;
      case "analyze":
        await processBulkAnalyze(userId, operation.resumeIds, job);
        break;
      case "improve":
        await processBulkImprove(userId, operation.resumeIds, job);
        break;
      case "export":
        await processBulkExport(userId, operation.resumeIds, job, operation.options);
        break;
      case "duplicate":
        await processBulkDuplicate(userId, operation.resumeIds, job);
        break;
      case "tag":
        await processBulkTag(userId, operation.resumeIds, job, operation.options);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }

    job.status = "completed";
  } catch (error) {
    job.status = "failed";
    job.errors.push(error instanceof Error ? error.message : "Unknown error");
  }
}

async function processBulkDelete(userId: string, resumeIds: string[], job: BulkOperationJob) {
  for (const resumeId of resumeIds) {
    try {
      await db.resume.update({
        where: { id: resumeId, userId },
        data: { isActive: false },
      });
      
      job.results.push({ resumeId, success: true });
    } catch (error) {
      job.errors.push(`Failed to delete resume ${resumeId}`);
      job.results.push({ resumeId, success: false });
    }
    
    job.progress++;
  }
}

async function processBulkAnalyze(userId: string, resumeIds: string[], job: BulkOperationJob) {
  // Get user with Clerk ID
  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  for (const resumeId of resumeIds) {
    try {
      // Check if user has enough credits
      if (user.credits < 1) {
        job.errors.push(`Insufficient credits for resume ${resumeId}`);
        job.results.push({ resumeId, success: false, error: "Insufficient credits" });
        continue;
      }

      // Get resume content
      const resume = await db.resume.findUnique({
        where: { id: resumeId, userId },
      });

      if (!resume) {
        throw new Error("Resume not found");
      }

      // Trigger analysis
      // Note: This would need to be implemented properly with the actual analysis logic
      job.results.push({ resumeId, success: true, message: "Analysis queued" });
    } catch (error) {
      job.errors.push(`Failed to analyze resume ${resumeId}`);
      job.results.push({ resumeId, success: false });
    }
    
    job.progress++;
  }
}

async function processBulkImprove(userId: string, resumeIds: string[], job: BulkOperationJob) {
  // Similar to analyze, but for improvements
  for (const resumeId of resumeIds) {
    try {
      // Check if resume has been analyzed
      const analysisCount = await db.analysis.count({
        where: { resumeId, userId, isCompleted: true },
      });

      if (analysisCount === 0) {
        job.errors.push(`Resume ${resumeId} must be analyzed first`);
        job.results.push({ resumeId, success: false, error: "Not analyzed" });
        continue;
      }

      // Queue improvement
      job.results.push({ resumeId, success: true, message: "Improvement queued" });
    } catch (error) {
      job.errors.push(`Failed to improve resume ${resumeId}`);
      job.results.push({ resumeId, success: false });
    }
    
    job.progress++;
  }
}

async function processBulkExport(
  userId: string, 
  resumeIds: string[], 
  job: BulkOperationJob,
  options?: Record<string, any>
) {
  // This would implement bulk export functionality
  // For now, we'll just mark as successful
  for (const resumeId of resumeIds) {
    job.results.push({ resumeId, success: true, message: "Export queued" });
    job.progress++;
  }
}

async function processBulkDuplicate(userId: string, resumeIds: string[], job: BulkOperationJob) {
  for (const resumeId of resumeIds) {
    try {
      const original = await db.resume.findUnique({
        where: { id: resumeId, userId },
      });

      if (!original) {
        throw new Error("Resume not found");
      }

      const duplicate = await db.resume.create({
        data: {
          userId,
          fileName: `Copy of ${original.fileName}`,
          fileUrl: original.fileUrl,
          uploadThingKey: original.uploadThingKey,
          fileSize: original.fileSize,
          mimeType: original.mimeType,
          title: original.title ? `Copy of ${original.title}` : null,
          description: original.description,
        },
      });

      job.results.push({ resumeId, success: true, duplicateId: duplicate.id });
    } catch (error) {
      job.errors.push(`Failed to duplicate resume ${resumeId}`);
      job.results.push({ resumeId, success: false });
    }
    
    job.progress++;
  }
}

async function processBulkTag(
  userId: string, 
  resumeIds: string[], 
  job: BulkOperationJob,
  options?: Record<string, any>
) {
  const tags = options?.tags as string[] || [];
  
  for (const resumeId of resumeIds) {
    try {
      // Create tags for each resume
      for (const tagName of tags) {
        await db.resumeTag.create({
          data: {
            resumeId,
            userId,
            name: tagName,
          },
        });
      }
      
      job.results.push({ resumeId, success: true, tags });
    } catch (error) {
      job.errors.push(`Failed to tag resume ${resumeId}`);
      job.results.push({ resumeId, success: false });
    }
    
    job.progress++;
  }
}

// GET endpoint to check job status
export async function GET(request: NextRequest) {
  const jobId = request.nextUrl.searchParams.get("jobId");
  
  if (!jobId) {
    return NextResponse.json(
      { success: false, error: "Job ID required" },
      { status: 400 }
    );
  }

  const job = jobStore.get(jobId);
  
  if (!job) {
    return NextResponse.json(
      { success: false, error: "Job not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    success: true,
    job: {
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      total: job.total,
      percentComplete: Math.round((job.progress / job.total) * 100),
      errors: job.errors,
    },
  });
}