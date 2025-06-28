import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// Generate typed components with our file router
export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();

// Generate typed hooks for use in components
export const { useUploadThing, uploadFiles } = generateReactHelpers<OurFileRouter>();

// Export types for use in components
export type { OurFileRouter }; 