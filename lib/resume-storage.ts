import { db } from '@/lib/db';
import { getCurrentUserFromDB } from '@/lib/auth/user-sync';

// Helper function to retrieve resume data (used by API routes)
export async function getResumeData(resumeId: string, clerkUserId: string) {
  console.log('[RESUME_STORAGE] Looking up resume:', { resumeId, clerkUserId });
  
  try {
    // First, get the database user ID from the Clerk user ID
    console.log('[RESUME_STORAGE] Getting database user ID...');
    const dbUser = await getCurrentUserFromDB();
    
    if (!dbUser) {
      console.log('[RESUME_STORAGE] Database user not found for Clerk ID:', clerkUserId);
      return null;
    }

    console.log('[RESUME_STORAGE] Found database user:', {
      dbUserId: dbUser.id,
      email: dbUser.email
    });

    const resume = await db.resume.findFirst({
      where: {
        id: resumeId,
        userId: dbUser.id, // Use database user ID instead of Clerk user ID
        isActive: true,
      },
    });

    console.log('[RESUME_STORAGE] Database query result:', resume ? {
      id: resume.id,
      userId: resume.userId,
      fileName: resume.fileName,
      fileUrl: resume.fileUrl,
      fileSize: resume.fileSize,
      isActive: resume.isActive,
      createdAt: resume.createdAt
    } : 'null');

    if (!resume) {
      console.log('[RESUME_STORAGE] No resume found matching criteria');
      return null;
    }

    // Check if it's a legacy base64 storage or UploadThing URL
    if (resume.fileUrl.startsWith('data:application/pdf;base64,')) {
      console.log('[RESUME_STORAGE] Using legacy base64 data');
      // Legacy: extract base64 data from data URL
      const fileData = resume.fileUrl.split(',')[1];
      
      return {
        fileData,
        fileName: resume.fileName,
        resumeId: resume.id,
      };
    } else {
      console.log('[RESUME_STORAGE] Downloading file from UploadThing URL:', resume.fileUrl);
      
      // New approach: download file from UploadThing URL
      try {
        const response = await fetch(resume.fileUrl, {
          headers: {
            'User-Agent': 'AplyCat/1.0',
            'Accept': 'application/pdf,*/*'
          }
        });
        
        if (!response.ok) {
          console.error('[RESUME_STORAGE] Failed to download file from UploadThing:', response.status, response.statusText);
          
          // Try with different approach - sometimes UploadThing needs time
          if (response.status === 404) {
            console.log('[RESUME_STORAGE] Retrying after 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const retryResponse = await fetch(resume.fileUrl, {
              headers: {
                'User-Agent': 'AplyCat/1.0',
                'Accept': 'application/pdf,*/*'
              }
            });
            
            if (!retryResponse.ok) {
              console.error('[RESUME_STORAGE] Retry also failed:', retryResponse.status, retryResponse.statusText);
              return null;
            }
            
            // Use retry response
            const arrayBuffer = await retryResponse.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const fileData = buffer.toString('base64');

            console.log('[RESUME_STORAGE] Successfully downloaded file on retry:', {
              fileName: resume.fileName,
              resumeId: resume.id,
              fileDataLength: fileData.length,
              originalFileSize: resume.fileSize
            });

            return {
              fileData,
              fileName: resume.fileName,
              resumeId: resume.id,
            };
          }
          
          return null;
        }

        // Convert to base64 for compatibility with existing analysis code
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const fileData = buffer.toString('base64');

        console.log('[RESUME_STORAGE] Successfully downloaded and converted file:', {
          fileName: resume.fileName,
          resumeId: resume.id,
          fileDataLength: fileData.length,
          originalFileSize: resume.fileSize
        });

        return {
          fileData,
          fileName: resume.fileName,
          resumeId: resume.id,
        };
      } catch (downloadError) {
        console.error('[RESUME_STORAGE] Error downloading file from UploadThing:', downloadError);
        return null;
      }
    }
  } catch (error: any) {
    console.error('[RESUME_STORAGE] Error retrieving resume data:', error);
    console.error('[RESUME_STORAGE] Error stack:', error.stack);
    return null;
  }
} 