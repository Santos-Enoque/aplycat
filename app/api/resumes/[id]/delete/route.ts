import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { deleteResumeFile } from "@/lib/file-management";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Get the resume with related data
    const resume = await db.resume.findFirst({
      where: { 
        id: id,
        userId: user.id,
        isActive: true 
      },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        uploadThingKey: true,
        _count: {
          select: {
            analyses: true,
            improvedResumes: true
          }
        }
      }
    });

    if (!resume) {
      return NextResponse.json(
        { success: false, error: "Resume not found" },
        { status: 404 }
      );
    }

    // Start database transaction
    const result = await db.$transaction(async (tx) => {
      // Soft delete the resume (set isActive to false)
      const deletedResume = await tx.resume.update({
        where: { id: id },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      });

      // Also soft delete related analyses and improvements
      await tx.analysis.updateMany({
        where: { resumeId: id },
        data: { isActive: false }
      });

      await tx.improvedResume.updateMany({
        where: { resumeId: id },
        data: { isActive: false }
      });

      return deletedResume;
    });

    // Delete file from UploadThing if it exists (run in background)
    if (resume.uploadThingKey) {
      deleteResumeFile(resume.uploadThingKey)
        .then(() => {
          console.log(`[DELETE] Successfully deleted UploadThing file: ${resume.uploadThingKey}`);
        })
        .catch((error) => {
          console.error(`[DELETE] Failed to delete UploadThing file: ${resume.uploadThingKey}`, error);
          // Don't fail the request if UploadThing deletion fails
          // The database record is already marked as deleted
        });
    }

    console.log(`[DELETE] Resume deleted: ${resume.fileName} (ID: ${id})`);
    console.log(`[DELETE] Related data: ${resume._count.analyses} analyses, ${resume._count.improvedResumes} improvements`);

    return NextResponse.json({
      success: true,
      message: "Resume deleted successfully",
      resumeId: id,
      fileName: resume.fileName,
      relatedData: {
        analyses: resume._count.analyses,
        improvements: resume._count.improvedResumes
      }
    });

  } catch (error) {
    console.error("[DELETE] Error deleting resume:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}