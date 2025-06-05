import { createUploadthing, type FileRouter } from "uploadthing/next";
import { currentUser } from "@clerk/nextjs/server";
import { UploadThingError } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
  resumeUploader: f({ pdf: { maxFileSize: "8MB", maxFileCount: 1 } })
    .middleware(async ({ req }) => {
      console.log('[UPLOADTHING] Middleware - checking authentication...');
      
      // Authenticate user
      const user = await currentUser();
      
      if (!user) {
        console.log('[UPLOADTHING] No authenticated user found');
        throw new UploadThingError("Unauthorized");
      }

      console.log('[UPLOADTHING] Authenticated user:', {
        userId: user.id,
        email: user.emailAddresses?.[0]?.emailAddress
      });

      // Return metadata to be attached to file
      return { 
        userId: user.id,
        userEmail: user.emailAddresses?.[0]?.emailAddress || 'unknown'
      };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log('[UPLOADTHING] Upload complete:', {
        fileName: file.name,
        fileSize: file.size,
        fileUrl: file.ufsUrl,
        userId: metadata.userId
      });

      // File is uploaded! Return metadata for client-side use
      return { 
        uploadedBy: metadata.userId,
        fileUrl: file.ufsUrl,
        fileName: file.name,
        fileSize: file.size
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter; 