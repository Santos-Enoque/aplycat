import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth } from "@clerk/nextjs";
import { db, analyticsHelpers } from "@/lib/db";

const f = createUploadthing();

export const ourFileRouter = {
  resumeUploader: f({ 
    pdf: { maxFileSize: "10MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "10MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "10MB", maxFileCount: 1 }
  })
    .middleware(async ({ req }) => {
      // Check authentication
      const { userId } = auth();
      if (!userId) {
        throw new Error("Unauthorized - You must be logged in to upload files");
      }

      // Get user from database to ensure they exist
      const user = await db.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, email: true }
      });

      if (!user) {
        throw new Error("User not found in database");
      }

      console.log(`[UploadThing] File upload initiated by user: ${user.email}`);

      return { 
        userId: user.id,
        clerkUserId: userId,
        userEmail: user.email
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log(`[UploadThing] File upload completed:`, {
          fileName: file.name,
          fileSize: file.size,
          fileUrl: file.url,
          fileKey: file.key,
          userId: metadata.userId
        });

        // Save file metadata to database
        const resume = await db.resume.create({
          data: {
            userId: metadata.userId,
            fileName: file.name,
            fileUrl: file.url,
            fileSize: file.size,
            mimeType: file.type,
            title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension for title
          },
        });

        // Track the upload event for analytics
        await analyticsHelpers.trackEvent(
          'RESUME_UPLOAD',
          metadata.userId,
          {
            fileName: file.name,
            fileSize: file.size,
            uploadMethod: 'uploadthing',
            resumeId: resume.id
          }
        );

        console.log(`[UploadThing] Resume saved to database with ID: ${resume.id}`);

        return { 
          uploadedBy: metadata.clerkUserId,
          resumeId: resume.id,
          success: true,
          message: "File uploaded successfully"
        };
      } catch (error) {
        console.error(`[UploadThing] Error saving file metadata:`, error);
        
        // Even if database save fails, the file was uploaded to UploadThing
        // We should still return success but log the error
        return {
          uploadedBy: metadata.clerkUserId,
          success: false,
          error: "File uploaded but failed to save metadata",
          message: error instanceof Error ? error.message : "Unknown error"
        };
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;