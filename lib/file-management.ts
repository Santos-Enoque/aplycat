/**
 * File Management Utilities for UploadThing Integration
 * Handles file deletion, download URLs, and file operations
 */

import { db } from "@/lib/db";
import { UTApi } from "uploadthing/server";

// Initialize UploadThing API
const utapi = new UTApi();

export interface FileUploadResult {
  url: string;
  key: string;
  name: string;
  size: number;
  resumeId?: string;
}

export interface FileDeleteResult {
  success: boolean;
  error?: string;
}

/**
 * Delete a file from UploadThing and update database record
 */
export async function deleteResumeFile(
  resumeId: string,
  userId: string
): Promise<FileDeleteResult> {
  try {
    // Get resume record with uploadThingKey
    const resume = await db.resume.findFirst({
      where: {
        id: resumeId,
        userId: userId, // Ensure user owns the file
      },
      select: {
        id: true,
        uploadThingKey: true,
        fileName: true,
        fileUrl: true,
      },
    });

    if (!resume) {
      return {
        success: false,
        error: "Resume not found or access denied",
      };
    }

    // If it's a Base64 data URL, no file deletion needed from UploadThing
    if (resume.fileUrl.startsWith("data:")) {
      console.log(`[FILE_MANAGEMENT] Deleting Base64 resume: ${resume.fileName}`);
      
      // Just delete from database
      await db.resume.delete({
        where: { id: resumeId },
      });

      return { success: true };
    }

    // If it has an UploadThing key, delete from UploadThing
    if (resume.uploadThingKey) {
      console.log(`[FILE_MANAGEMENT] Deleting UploadThing file: ${resume.uploadThingKey}`);
      
      try {
        // Delete from UploadThing
        await utapi.deleteFiles([resume.uploadThingKey]);
        console.log(`[FILE_MANAGEMENT] Successfully deleted file from UploadThing`);
      } catch (uploadThingError) {
        console.error(`[FILE_MANAGEMENT] Failed to delete from UploadThing:`, uploadThingError);
        // Continue with database deletion even if UploadThing deletion fails
      }
    }

    // Delete database record
    await db.resume.delete({
      where: { id: resumeId },
    });

    console.log(`[FILE_MANAGEMENT] Successfully deleted resume: ${resume.fileName}`);
    return { success: true };
  } catch (error) {
    console.error(`[FILE_MANAGEMENT] Error deleting resume file:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get a secure download URL for a file
 * Handles both UploadThing URLs and Base64 data URLs
 */
export async function getFileDownloadUrl(
  resumeId: string,
  userId: string
): Promise<string | null> {
  try {
    // Get resume record
    const resume = await db.resume.findFirst({
      where: {
        id: resumeId,
        userId: userId, // Ensure user owns the file
      },
      select: {
        fileUrl: true,
        fileName: true,
        uploadThingKey: true,
      },
    });

    if (!resume) {
      console.error(`[FILE_MANAGEMENT] Resume not found: ${resumeId}`);
      return null;
    }

    // If it's a Base64 data URL, return as-is
    if (resume.fileUrl.startsWith("data:")) {
      console.log(`[FILE_MANAGEMENT] Returning Base64 data URL for: ${resume.fileName}`);
      return resume.fileUrl;
    }

    // If it's an UploadThing URL, return the direct URL
    // UploadThing URLs are already publicly accessible
    console.log(`[FILE_MANAGEMENT] Returning UploadThing URL for: ${resume.fileName}`);
    return resume.fileUrl;
  } catch (error) {
    console.error(`[FILE_MANAGEMENT] Error getting download URL:`, error);
    return null;
  }
}

/**
 * Get file metadata and stats
 */
export async function getFileMetadata(
  resumeId: string,
  userId: string
): Promise<{
  fileName: string;
  fileSize: number | null;
  mimeType: string | null;
  uploadMethod: "uploadthing" | "base64";
  createdAt: Date;
} | null> {
  try {
    const resume = await db.resume.findFirst({
      where: {
        id: resumeId,
        userId: userId,
      },
      select: {
        fileName: true,
        fileSize: true,
        mimeType: true,
        fileUrl: true,
        uploadThingKey: true,
        createdAt: true,
      },
    });

    if (!resume) {
      return null;
    }

    return {
      fileName: resume.fileName,
      fileSize: resume.fileSize,
      mimeType: resume.mimeType,
      uploadMethod: resume.fileUrl.startsWith("data:") ? "base64" : "uploadthing",
      createdAt: resume.createdAt,
    };
  } catch (error) {
    console.error(`[FILE_MANAGEMENT] Error getting file metadata:`, error);
    return null;
  }
}

/**
 * List all files for a user with their storage method
 */
export async function listUserFiles(userId: string): Promise<
  Array<{
    id: string;
    fileName: string;
    fileSize: number | null;
    uploadMethod: "uploadthing" | "base64";
    createdAt: Date;
  }>
> {
  try {
    const resumes = await db.resume.findMany({
      where: {
        userId: userId,
        isActive: true,
      },
      select: {
        id: true,
        fileName: true,
        fileSize: true,
        fileUrl: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return resumes.map((resume) => ({
      id: resume.id,
      fileName: resume.fileName,
      fileSize: resume.fileSize,
      uploadMethod: resume.fileUrl.startsWith("data:") ? "base64" : "uploadthing",
      createdAt: resume.createdAt,
    }));
  } catch (error) {
    console.error(`[FILE_MANAGEMENT] Error listing user files:`, error);
    return [];
  }
}

/**
 * Upload a file using UploadThing programmatically
 * Useful for migrating Base64 files to UploadThing
 */
export async function uploadFileToUploadThing(
  file: File,
  userId: string
): Promise<FileUploadResult | null> {
  try {
    console.log(`[FILE_MANAGEMENT] Uploading file to UploadThing: ${file.name}`);

    // Upload file to UploadThing
    const uploadResult = await utapi.uploadFiles(file);

    if (!uploadResult.data) {
      throw new Error("UploadThing upload failed");
    }

    const uploadedFile = uploadResult.data;

    // Save to database
    const resume = await db.resume.create({
      data: {
        userId: userId,
        fileName: file.name,
        fileUrl: uploadedFile.url,
        uploadThingKey: uploadedFile.key,
        fileSize: file.size,
        mimeType: file.type,
        title: file.name.replace(/\.[^/.]+$/, ""), // Remove file extension for title
      },
    });

    console.log(`[FILE_MANAGEMENT] Successfully uploaded and saved: ${file.name}`);

    return {
      url: uploadedFile.url,
      key: uploadedFile.key,
      name: file.name,
      size: file.size,
      resumeId: resume.id,
    };
  } catch (error) {
    console.error(`[FILE_MANAGEMENT] Error uploading file:`, error);
    return null;
  }
}

/**
 * Get storage statistics for a user
 */
export async function getUserStorageStats(userId: string): Promise<{
  totalFiles: number;
  totalSize: number;
  uploadThingFiles: number;
  base64Files: number;
  uploadThingSize: number;
  base64Size: number;
}> {
  try {
    const resumes = await db.resume.findMany({
      where: {
        userId: userId,
        isActive: true,
      },
      select: {
        fileSize: true,
        fileUrl: true,
      },
    });

    const stats = {
      totalFiles: resumes.length,
      totalSize: 0,
      uploadThingFiles: 0,
      base64Files: 0,
      uploadThingSize: 0,
      base64Size: 0,
    };

    resumes.forEach((resume) => {
      const fileSize = resume.fileSize || 0;
      stats.totalSize += fileSize;

      if (resume.fileUrl.startsWith("data:")) {
        stats.base64Files++;
        stats.base64Size += fileSize;
      } else {
        stats.uploadThingFiles++;
        stats.uploadThingSize += fileSize;
      }
    });

    return stats;
  } catch (error) {
    console.error(`[FILE_MANAGEMENT] Error getting storage stats:`, error);
    return {
      totalFiles: 0,
      totalSize: 0,
      uploadThingFiles: 0,
      base64Files: 0,
      uploadThingSize: 0,
      base64Size: 0,
    };
  }
}